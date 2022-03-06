const express = require('express')
const app = express()
const port = 3000
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
import { PdfData, VerbosityLevel } from 'pdfdataextract';
import { fstat, readFileSync, writeFileSync, fs } from 'fs';
import { match } from 'assert';
import { time } from 'console';
import { nextTick } from 'process';
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
            
                let moi = parse(data.text.toString())
                let { value } = ics.createEvents(moi)
                
                writeFileSync('public/events.ics', value);
                res.sendFile('events.ics', {root: 'public'})
                


            });
            //send response
            /*res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: lista.name,
                    mimetype: lista.mimetype,
                    size: lista.size
                }
            });*/
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/pdf', (req, res) => {

})


class tyovuoro {
    constructor(Weekday, Date, StartTime, EndTime, Address, Summary, Length){
        this.Weekday = Weekday;
        this.Date = Date;
        this.StartTime = StartTime;
        this.EndTime = EndTime;
        this.Address = Address;
        this.Summary = Summary;
        this.Length = Length;
    }

}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

function parse(text) {
    // console.log(text)
    const alku = /Nimi(.+\w)\n(.+)\n(\d+.\d+.\d+)\s-\s(\d\d?.\d\d?.\d+)/g

    const helsinki = /([a-z]{2})(\d+.\d+)\s(\d+:\d+)\s-\s(\d+:\d+)\s([A-zäö]+\s\d+)([A-z]+\s\d{1,3})\s?(\d+:\d\d)(\d+:\d+)?\n/g
    const pori = /([a-z]{2})(\d+.\d+)\s(\d+:\d+)?\s-\s(\d+:\d+)\s(.*)(\d{3}\s[A-zöä]+)\s?(\d+:\d\d)/g
    let matches
    let events = []
    if(helsinki.test(text)) matches = text.matchAll(helsinki)
    else if(pori.test(text)) matches = text.matchAll(pori)
    else return "Error"

    let listobj= []
    for (const match of matches){
        listobj.push(new tyovuoro(match[1], match[2], match[3], match[4], match[5], match[6], match[7]))
        let DateObj = new Date()
        let date = match[2].split('.')
        let time = match[3].split(':')
        let duration = match[7].split(':')
        events.push({
            title: match[6],
            location: match[5],
            start: [DateObj.getFullYear(), parseInt(date[1]), parseInt(date[0]), parseInt(time[0]), parseInt(time[1])],
            duration: { hours: parseInt(duration[0]), minutes: parseInt(duration[1])}
        })
    }
    
    return events
}