// Curated fixed display sizes for RU/CIS campaign setup.
// Ordering intentionally starts with Yandex's explicitly recommended high-coverage sizes,
// then common fixed desktop/mobile sizes supported by Yandex Direct and Soloway SSP,
// then additional SSP/special placements. Manual size entry remains available.
export const FORMAT_GROUPS=[
 {id:'popular',label:'Popular / high coverage',items:[[240,400],[300,250],[728,90]]},
 {id:'common',label:'Common display',items:[[300,600],[160,600],[336,280],[300,300],[300,500],[240,600],[970,250],[320,50],[320,100],[320,480],[480,320],[1000,120]]},
 {id:'extended',label:'Extended SSP formats',items:[[970,90],[200,200],[580,400],[600,300],[400,240]]},
 {id:'special',label:'Special / premium',items:[[1456,180],[640,268]]}
];
export const FORMAT_SOURCES={
 yandex:'https://yandex.ru/support/direct/ru/products-cpm-campaign/requirements',
 yandexTechnical:'https://yandex.ru/support/direct/ru/moderation/technical-restrictions',
 soloway:'https://www.soloway.ru/help/legal/external-dsp/'
};
