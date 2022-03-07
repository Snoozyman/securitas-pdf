const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
import { PdfData, VerbosityLevel } from 'pdfdataextract';
import { fstat, readFileSync, writeFileSync, fs } from 'fs';
import { match } from 'assert';
import { time } from 'console';
import { nextTick } from 'process';
import { utc } from 'moment';
const ics = require('ics');
const moment = require('moment')
const path = require('path')

app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

console.log(moment())//.format('YYYY-M-D-H-m').split("-"))

app.get('/', (req,res) => {
    res.send(`
    <html>
    <body>
        <h1>Lataa työvuorolistasi tästä:</h1>

        <form action='/tyot' method='POST' enctype='multipart/form-data'>
        <label>Select file to upload</label>
        <input type='file' name='lista'><br><br>
        <input type='submit' name='upload_btn' value='Lataa'>
    </form>
    </body>
    
    </html>`)
})

app.post('/tyot', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let lista = req.files.lista;
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            //avatar.mv('./uploads/' + lista.name);
            const file_data = lista.data;

            // all options are optional
            PdfData.extract(file_data, {
                pages: 1, // how many pages should be read at most
                sort: true, // sort the text by text coordinates
                verbosity: VerbosityLevel.ERRORS, // set the verbosity level for parsing
                get: { // enable or disable data extraction (all are optional and enabled by default)
                    pages: true, // get number of pages
                    text: true, // get text of each page
                },
            }).then((data) => {
                data.pages; // the number of pages
            
                let events = []
                let lista = parse(data.text.toString());
                lista.forEach(t => {
                    events.push({
                        start: [ t.start.getFullYear(), t.start.getMonth()+1, t.start.getDate(), t.start.getHours(), t.start.getMinutes()],
                        //startInputType: 'utc',
                        startOutputType: 'local',
                        end: [t.end.getFullYear(), t.end.getMonth()+1, t.end.getDate(), t.end.getHours(),t.end.getMinutes()],
                        //endInputType: 'utc',
                        endOutputType: 'local',
                        title: t.Summary,
                        location: t.Address,

                    })
                })
                const { error, value } = ics.createEvents(events)
                if(error) res.send(error)
                
                writeFileSync('public/events.ics', value);
                // res.sendFile('events.ics', {root: 'public'})
                res.download('public/events.ics', 'tyolista-' + moment().format("YYYYMMDD"))

            });
      
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/pdf', (req, res) => {
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
        let events = []
                let lista = parse(p);
                lista.forEach(t => {
                    events.push({
                        start: [ t.start.getFullYear(), t.start.getMonth()+1, t.start.getDate(), t.start.getHours(), t.start.getMinutes()],
                        //startInputType: 'utc',
                        startOutputType: 'local',
                        end: [t.end.getFullYear(), t.end.getMonth()+1, t.end.getDate(), t.end.getHours(),t.end.getMinutes()],
                        //endInputType: 'utc',
                        endOutputType: 'local',
                        title: t.Summary,
                        location: t.Address,

                    })
                })
                const { error, value } = ics.createEvents(events)
                if(error) res.send(error)
                res.send(value)
})


class tyovuoro {
    constructor(Weekday, Date, StartTime, EndTime, Address, Summary, Length){
        this.Weekday = Weekday;
        this.Date = {
            day: parseInt(Date.split('.')[0]),
            month: parseInt(Date.split('.')[1])
        };
        this.StartTime = {
            hours: parseInt(StartTime.split(':')[0]),
            mins: parseInt(StartTime.split(':')[1])
        };
        this.EndTime = {
            hours: parseInt(EndTime.split(':')[0]),
            mins: parseInt(EndTime.split(':')[1])
        };
        this.Address = Address;
        this.Summary = Summary;
        this.Length = {
            hours: parseInt(Length.split(':')[0]),
            mins: parseInt(Length.split(':')[1])
        };
        this.start;
        this.end;
    }
    toISOString() {
        let start = new Date();
        let end = new Date();
        let year = start.getFullYear();
        start.setFullYear(year, this.Date.month-1, this.Date.day);
        start.setHours(this.StartTime.hours, this.StartTime.mins, 0, 0)
        this.start = start;
        
        let enddate = this.Date.day;
        if(this.isNextDay()) {
            enddate += 1;
        }
        end.setFullYear(year, this.Date.month-1, enddate);
        end.setHours(this.EndTime.hours, this.EndTime.mins, 0, 0);
        this.end = end;

    }
    isNextDay() {
        if(this.StartTime.hours > this.EndTime.hours & this.EndTime.hours >= 0) return true;
        else return false;
    }

}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

function parse(text) {
    // console.log(text)
    let lista = []
    const alku = /Nimi(.+\w)\n(.+)\n(\d+.\d+.\d+)\s-\s(\d\d?.\d\d?.\d+)/g
    
    const helsinki = /([a-z]{2})(\d+\.\d+)\s(\d+\:\d+)\s\-\s(\d+:\d+)\s([A-zäö]+\s\d+)([A-z]+\s\d{1,3})\s?(\d+\:\d\d)(\d+:\d+)?/gm;
    const pori = /([a-z]{2})(\d+.\d+)\s(\d+:\d+)?\s-\s(\d+:\d+)\s(.*)(\d{3}\s[A-zöä]+)\s?(\d+:\d\d)/g;

    const matches = text.matchAll(helsinki)
    

    for (const match of matches){
        lista.push(new tyovuoro(match[1],match[2],match[3],match[4],match[5],match[6],match[7]))
        
    }
    lista.forEach(t => {
        t.toISOString()
    })
    
    return lista
}