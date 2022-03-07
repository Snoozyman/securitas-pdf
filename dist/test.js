"use strict";

let p = `
Hnro36264Securitas Oy
NimiMikko Tuomikoski
Työvuorolista
4.3.2022 - 3.4.2022
PVM Alkaa/PäättyyLähtöpaikka/yksikköKuvausTunnitViikkotunnit
pe18.3 18:00 - 06:00 Elimäenkatu 28Helsinki 60512:00
la19.3 19:00 - 06:00 Elimäenkatu 28Helsinki 60511:00
su20.3 19:00 - 06:00 Elimäenkatu 28Helsinki 605 11:0028:00
ke23.3 18:00 - 06:00 Elimäenkatu 28Helsinki 60512:00
to24.3 18:00 - 06:00 Elimäenkatu 28Helsinki 605 12:0030:00
        ma28.3 18:00 - 06:00 Elimäenkatu 28Helsinki 60512:00
        ti29.3 18:00 - 06:00 Elimäenkatu 28Helsinki 60512:00
        pe1.4 18:00 - 06:00 Elimäenkatu 28Helsinki 60512:00
        la2.4 19:00 - 06:00 Elimäenkatu 28Helsinki 60511:00
        su3.4 19:00 - 06:00 Elimäenkatu 28Helsinki 605 5:0052:00
        Tulostettu: 27.2.2022 20:54:47 
        Jakson tunnit 110:00
        yhteensä:`;
const helsinki = /([a-z]{2})(\d+\.\d+)\s(\d+\:\d+)\s\-\s(\d+:\d+)\s([A-zäö]+\s\d+)([A-z]+\s\d{1,3})\s?(\d+\:\d\d)(\d+:\d+)?/gm;
const matches = p.matchAll(helsinki);

for (const match of matches) {
  console.log(match[0]);
}