/*
  The assumption:
  1. The primary key of each tap record is PAN number
  2. The companyId is irrelavant
  3. The first record must be of type ON, no left over records from yesterday
  4. The next record of a ON record must be OFF
  e.g. tapping ON on bus1 and taopping ON on bus2 will not result in 2 ON record
  instead ON at bus1 and OFF at bus2

  Process:
  1. group tap records by PAN.

  For each PAN's records:
  2. Get the first record which must be of type ON. New a Trip object. 
  	 Record its started time, fromStop, companyId, busID and PAN.
  	 The finished time, durationSecs, toStop, chargeAmount and status can be dertermined once found the next tap record of OFF
  3. Find the next tap record of OFF
    3.1 If not found, the trip status is unfinished, chargeAmount be Max value, other field remains empty.
  	  	Finish one trip record and find another ON record.
  	  3.1.1 Has another ON record, repeat the process starting from 2
  	  3.1.2 No record, move to another PAN's records
  	3.2 If found, the bus id is the same, calculateFee(ONSTOP, OFFSTOP), id different, charge be Max, fill the remaining fields.
	  	Finish one trip record and find another ON record.
	  3.2.1 Has another ON record, repeat the process starting from 2
	  3.2.2 No record, move to another PAN's records


  Scenarios:
  1. Person ON BUS1, and OFF BUS1, with ON before OFF => Completed trip, calculateFee(ONSTOP, OFFSTOP)
  2. Person ON BUS1, and OFF BUS1, with ON after OFF => 


*/


const csvFilePath='./taps.csv'
const csv=require('csvtojson')
const { Parser } = require('json2csv')
const writeFile = require('fs').writeFile
const _ = require('lodash')

const COMPLETED = "completed"
const UNFINISHED = "unfinished"
const CANCELLED = "cancelled"
const status = {COMPLETED, UNFINISHED,CANCELLED} 

const STOP1AND2 = 3.25
const STOP2AND3 = 5.5
const STOP1AND3 = 7.3
const MAX = 7.3
const price = {STOP1AND2, STOP2AND3, STOP1AND3, MAX}

class Trip {
	constructor() {
		this.started = ""
		this.finished = ""
		this.durationSecs = 0
		this.fromStop = ""
		this.toStop = ""
		this.chargeAmount = ""
		this.companyId = ""
		this.busId = ""
		this.PAN = 0
		this.status = ""
 	}
}

const processData = json => {
	_.
	return json
}

csv()
	.fromFile(csvFilePath)
	.then((jsonObj)=>{
	    const processed = processData(jsonObj)
	    const json2csvParser = new Parser({quote: ""});
		const csv = json2csvParser.parse(processed);
		writeFile('./trips.csv', csv, (err) => {
		if(err) {
	        console.log(err)
	    }
	    console.log('trips.csv generated!')
	});
})




 