/*
  The assumption:
  1. The primary key of each tap record is PAN number
  2. The companyId is irrelavant
  3. The first record must be of type ON
  4. Tapping OFF at different busID (tap ON on bus1 and tap OFF on bus2)  
  is taken as a COMPLETED trip instead of a UNFINISHED trip and charges MAX.
  // although it seems Bus should only be able to tapped ON before it can be tapped OFF. Just in case...

  Process:
  1. group tap records by PAN.

  For each PAN's records:
  2. Get the first record which must be of type ON. New a Trip object. 
  	Record its started time, fromStop, companyId, busID and PAN.
  	The finished time, durationSecs, toStop, chargeAmount and status can be dertermined once found the next tap record of OFF
  3. Check if the next tap record is OFF
    3.1 If not or there's no next tap, the trip status is unfinished, chargeAmount be Max value, other field remains empty. Finish one trip record and push to the collection
  	3.2 If is, the bus id is the same, calculateFee(ONSTOP, OFFSTOP), id different, charge be Max, fill the remaining fields. 
  		The same stop, status cancelled, fee 0. Finish one trip record, push to the collection
  4. Find another ON record within same PAN's records
  	4.1 Has another ON record, repeat the process starting from 2
  	4.2 No record, move to another PAN
*/

const csvFilePath='./taps.csv'
const csv=require('csvtojson')
const { Parser } = require('json2csv')
const writeFile = require('fs').writeFile
const _ = require('lodash')
const moment = require('moment')

const COMPLETED = "completed"
const UNFINISHED = "unfinished"
const CANCELLED = "cancelled"
const STATUS = {COMPLETED, UNFINISHED,CANCELLED} 

const STOP1AND2 = 3.25
const STOP2AND3 = 5.5
const STOP1AND3 = 7.3
const MAX = 7.3
const PRICE = {STOP1AND2, STOP2AND3, STOP1AND3, MAX}

class Trip {
	constructor(
		started = "", 
		finished = "",
		durationSecs = 0,
		fromStop = "",
		toStop = "",
		chargeAmount = "",
		companyId = "",
		busId = "",
		PAN = 0,
		status = "") {
		this.started = started
		this.finished = finished
		this.durationSecs = durationSecs
		this.fromStop = fromStop
		this.toStop = toStop
		this.chargeAmount = chargeAmount
		this.companyId = companyId
		this.busId = busId
		this.PAN = PAN
		this.status = status
 	}
}

const calculateFee = (stop1, stop2) => {
	const first = stop1[stop1.length - 1]
	const second = stop2[stop2.length - 1]
	if (Number(first) + Number(second) == 3) return PRICE.STOP1AND2
	if (Number(first) + Number(second) == 4) return PRICE.STOP1AND3
	if (Number(first) + Number(second) == 5) return PRICE.STOP2AND3
}

const fillTripByStatus = (trip, startTap = null, record = null, status) => {
	switch (status) {
		case STATUS.COMPLETED : {
			trip.chargeAmount = record.BusID == startTap.BusID ? calculateFee(record.StopId, startTap.StopId) : PRICE.MAX
			trip.status = STATUS.COMPLETED
			break
		}
		case STATUS.UNFINISHED : {
			trip.chargeAmount = PRICE.MAX
			trip.status = STATUS.UNFINISHED
			return trip
		}
		case STATUS.CANCELLED : {
			trip.chargeAmount = 0
			trip.status = STATUS.CANCELLED
			break
		}
		default : break
	}
	trip.finished = record.DateTimeUTC
	const finishedTime = moment(record.DateTimeUTC, 'DD-MM-YYYY hh:mm:ss')
	const startTime = moment(startTap.DateTimeUTC, 'DD-MM-YYYY hh:mm:ss')
	trip.durationSecs = moment.duration(finishedTime.diff(startTime)).asSeconds()
	trip.toStop = record.StopId
	return trip
}

const generateTripsFromRecords = (records, trips) => {
	if (records.length == 0) {
		return trips
	}
	const startTap = records[0]
	const trip = new Trip(startTap.DateTimeUTC, 
		null, 
		null, 
		startTap.StopId, 
		null, 
		null, 
		startTap.CompanyId, 
		startTap.BusID, 
		startTap.PAN,
		null)
	if (records.length == 1) {
		trips.push(fillTripByStatus(trip, null, null, STATUS.UNFINISHED))
		return trips
	}
	const record = records[1]
	if (record.TapType == "OFF") {
		const filledTrip = record.StopId == startTap.StopId 
		? fillTripByStatus(trip, startTap, record, STATUS.CANCELLED) 
		: fillTripByStatus(trip, startTap, record, STATUS.COMPLETED)
		trips.push(filledTrip)
	} else {
		const filledTrip = fillTripByStatus(trip, null, null, STATUS.UNFINISHED)
		trips.push(filledTrip)
	}
	generateTripsFromRecords(records.splice(2, records.length), trips)
	return trips
}

const processData = json => {
	const trips = []
	const grouped = _.groupBy(json, 'PAN')
	for (let pan in grouped){
		const records = grouped[pan]
		const generatedTrips = generateTripsFromRecords(records, [])
		trips.push(...generatedTrips)
	}
	return trips
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
 