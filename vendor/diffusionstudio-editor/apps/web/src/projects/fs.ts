/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The asset library's view of a project folder on desktop: the main process
// reads and writes the manifest (as YAML) and lists and stats files; bytes
// come in as real Files (see ElectronFileHandle) and go out through the
// streaming FILE_WRITE_* channels.

import { MAIN_CHANNELS } from '@desktop/main-channels';
import { mainBridge } from '@/lib/ipc';
import { ElectronFileHandle } from '@/lib/electron-file-handle';
import { ElectronWritableFileHandle } from '@/lib/electron-file-writable';
import { isAbsoluteSource } from '@diffusionstudio/assets';

import type { Manifest, ProjectFS } from '@diffusionstudio/assets';
import type { StandaloneAssetSnapshot } from './standalone-model';

/** Streams `blob` to an absolute path in chunks. */
async function writeBlob(path: string, blob: Blob): Promise<void> {
	const target = new ElectronWritableFileHandle(path);
	const writable = await target.createWritable();
	const writer = writable.getWriter();
	try {
		let position = 0;
		const reader = blob.stream().getReader();
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			await writer.write({ type: 'write', data: value, position });
			position += value.byteLength;
		}
		await writer.close();
	} catch (error) {
		await writer.abort().catch(() => {});
		throw error;
	}
}

type BrowserProjectState = { files: Map<string, Blob>; manifest: Manifest | null };
const browserProjects = new Map<string, BrowserProjectState>();

function browserProject(dir: string): BrowserProjectState {
	let state = browserProjects.get(dir);
	if (!state) {
		state = { files: new Map(), manifest: null };
		browserProjects.set(dir, state);
	}
	return state;
}

const bytesToBase64 = (bytes: Uint8Array): string => {
	let value = '';
	for (let index = 0; index < bytes.length; index += 32768) {
		value += String.fromCharCode(...bytes.subarray(index, index + 32768));
	}
	return btoa(value);
};

const base64ToBytes = (value: string): Uint8Array => {
	const raw = atob(value);
	const bytes = new Uint8Array(raw.length);
	for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
	return bytes;
};

/** Serializes the browser-only asset library into the campaign document. */
export async function snapshotBrowserProjectFS(dir: string): Promise<StandaloneAssetSnapshot> {
	const state = browserProject(dir);
	return {
		manifest: state.manifest ? structuredClone(state.manifest) : null,
		files: await Promise.all([...state.files].map(async ([path, blob]) => ({
			path,
			mimeType: blob.type,
			dataBase64: bytesToBase64(new Uint8Array(await blob.arrayBuffer())),
		}))),
	};
}

/** Restores assets before AssetLibrary.load() resolves JSX `src` values. */
export function restoreBrowserProjectFS(dir: string, snapshot?: StandaloneAssetSnapshot): void {
	const state = browserProject(dir);
	state.files.clear();
	state.manifest = snapshot?.manifest ? structuredClone(snapshot.manifest as Manifest) : null;
	for (const file of snapshot?.files ?? []) {
		const bytes = base64ToBytes(file.dataBase64);
		const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
		state.files.set(file.path, new Blob([buffer], { type: file.mimeType }));
	}
}

function createBrowserProjectFS(dir: string): ProjectFS {
	const state = browserProject(dir);
	const fileFor = async (source: string): Promise<File> => {
		const blob = state.files.get(source);
		if (!blob) throw new Error('File not found: ' + source);
		return new File([blob], source.split('/').pop() || 'asset', { type: blob.type });
	};
	return {
		readManifest: async () => state.manifest,
		writeManifest: async (manifest) => { state.manifest = structuredClone(manifest); },
		list: async (source) => {
			const prefix = source ? source.replace(/\/$/, '') + '/' : '';
			const entries = new Map<string, { name: string; kind: 'file' | 'directory'; size: number; mtime: number }>();
			for (const [path, blob] of state.files) {
				if (!path.startsWith(prefix)) continue;
				const rest = path.slice(prefix.length);
				if (!rest) continue;
				const [name, ...tail] = rest.split('/');
				if (!name) continue;
				entries.set(name, tail.length ? { name, kind: 'directory', size: 0, mtime: 0 } : { name, kind: 'file', size: blob.size, mtime: 0 });
			}
			return [...entries.values()];
		},
		stat: async (source) => { const blob = state.files.get(source); return blob ? { size: blob.size, mtime: 0 } : null; },
		file: fileFor,
		write: async (path, data) => { state.files.set(path, data); },
		remove: async (path) => { for (const key of [...state.files.keys()]) if (key === path || key.startsWith(path + '/')) state.files.delete(key); },
	};
}

/** The `ProjectFS` of the project folder at `dir`. */
export function createProjectFS(dir: string): ProjectFS {
	if (!window.desktop) return createBrowserProjectFS(dir);
	const separator = dir.includes('\\') ? '\\' : '/';
	const absolute = (source: string): string =>
		isAbsoluteSource(source) ? source : `${dir}${separator}${source.split('/').join(separator)}`;

	return {
		absolute,
		readManifest: () => mainBridge.call(MAIN_CHANNELS.PROJECTS_MANIFEST_READ, { dir }),
		writeManifest: (manifest: Manifest) => mainBridge.call(MAIN_CHANNELS.PROJECTS_MANIFEST_WRITE, { dir, manifest }),
		list: (source) => mainBridge.call(MAIN_CHANNELS.PROJECTS_FS_LIST, { dir, source }),
		stat: (source) => mainBridge.call(MAIN_CHANNELS.PROJECTS_FS_STAT, { dir, source }),
		file: (source) => new ElectronFileHandle(absolute(source)).getFile(),
		write: (path, blob) => writeBlob(absolute(path), blob),
		remove: (path) => mainBridge.call(MAIN_CHANNELS.PROJECTS_FS_REMOVE, { dir, path }),
		realPath: (source) => mainBridge.call(MAIN_CHANNELS.PROJECTS_FS_REAL_PATH, { dir, source }),
		pathOf: (file) => window.desktop?.getPathForFile(file) || null,
	};
}
