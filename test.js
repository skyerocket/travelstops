var chai = require('chai');  

const { Parser } = require('json2csv')
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
	console.log(json)
	const trips = []
	const grouped = _.groupBy(json, 'PAN')
	for (let pan in grouped){
		const records = grouped[pan]
		const generatedTrips = generateTripsFromRecords(records, [])
		trips.push(...generatedTrips)
	}
	return trips
}


describe('Taps ON Stop1 and Taps OFF Stop 2', () => {
	const input = [
					  {
					    ID: '1',
					    DateTimeUTC: '22-01-2018 13:00:00',
					    TapType: 'ON',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					  },
					  {
					    ID: '2',
					    DateTimeUTC: '22-01-2018 13:05:00',
					    TapType: 'OFF',
					    StopId: 'Stop2',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					}]
  const output = processData(input) 
  it('Is a complete Trip', () => {	
    chai.expect(output[0].status).to.be.equal(STATUS.COMPLETED); 
  })
  it('It costs 3.25', () => {	
    chai.expect(output[0].chargeAmount).to.be.equal(PRICE.STOP1AND2);
  })    
  it('Duration calculates right', () => {	
  	chai.expect(output[0].durationSecs).to.be.equal(300);
  })
})

describe('Taps ON Stop1 and Taps OFF Stop 3', () => {
	const input = [
					  {
					    ID: '1',
					    DateTimeUTC: '22-01-2018 13:00:00',
					    TapType: 'ON',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					  },
					  {
					    ID: '2',
					    DateTimeUTC: '22-01-2018 13:10:00',
					    TapType: 'OFF',
					    StopId: 'Stop3',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					}]
  const output = processData(input) 
  it('Is a complete Trip', () => {	
    chai.expect(output[0].status).to.be.equal(STATUS.COMPLETED); 
  })
  it('It costs 7.3', () => {	
    chai.expect(output[0].chargeAmount).to.be.equal(PRICE.STOP1AND3);
  })    
  it('Duration calculates right', () => {	
  	chai.expect(output[0].durationSecs).to.be.equal(600);
  })
})

describe('Taps ON Stop2 and Taps OFF Stop 3', () => {
	const input = [
					  {
					    ID: '1',
					    DateTimeUTC: '22-01-2018 13:00:00',
					    TapType: 'ON',
					    StopId: 'Stop2',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					  },
					  {
					    ID: '2',
					    DateTimeUTC: '22-01-2018 13:10:00',
					    TapType: 'OFF',
					    StopId: 'Stop3',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					}]
  const output = processData(input) 
  it('Is a complete Trip', () => {	
    chai.expect(output[0].status).to.be.equal(STATUS.COMPLETED); 
  })
  it('It costs 5.5', () => {	
    chai.expect(output[0].chargeAmount).to.be.equal(PRICE.STOP2AND3);
  })    
})

describe('Taps ON Stop1 and Taps OFF Stop 1', () => {
	const input = [
					  {
					    ID: '1',
					    DateTimeUTC: '22-01-2018 13:00:00',
					    TapType: 'ON',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					  },
					  {
					    ID: '2',
					    DateTimeUTC: '22-01-2018 13:05:00',
					    TapType: 'OFF',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					}]
  const output = processData(input) 
  it('Is a cancelled Trip', () => {	
    chai.expect(output[0].status).to.be.equal(STATUS.CANCELLED); 
  })
  it('It costs 0', () => {	
    chai.expect(output[0].chargeAmount).to.be.equal(0);
  })    
})

describe('Taps ON Bus1 and Taps OFF Bus2 (at different stop)', () => {
	const input = [
					  {
					    ID: '1',
					    DateTimeUTC: '22-01-2018 13:00:00',
					    TapType: 'ON',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					  },
					  {
					    ID: '2',
					    DateTimeUTC: '22-01-2018 13:05:00',
					    TapType: 'OFF',
					    StopId: 'Stop3',
					    CompanyId: 'Company1',
					    BusID: 'Bus38',
					    PAN: '34343434343434'
					}]
  const output = processData(input) 
  it('Is a completed Trip', () => {	
    chai.expect(output[0].status).to.be.equal(STATUS.COMPLETED); 
  })
  it('It costs 7.3', () => {	
    chai.expect(output[0].chargeAmount).to.be.equal(PRICE.MAX);
  })    
})

describe('Taps ON Bus1 and Taps OFF Bus2 (at the same stop)', () => {
	const input = [
					  {
					    ID: '1',
					    DateTimeUTC: '22-01-2018 13:00:00',
					    TapType: 'ON',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					  },
					  {
					    ID: '2',
					    DateTimeUTC: '22-01-2018 13:05:00',
					    TapType: 'OFF',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus38',
					    PAN: '34343434343434'
					}]
  const output = processData(input) 
  it('Is a cancelled Trip', () => {	
    chai.expect(output[0].status).to.be.equal(STATUS.CANCELLED); 
  })
  it('It costs 0', () => {	
    chai.expect(output[0].chargeAmount).to.be.equal(0);
  })    
})

describe('Taps ON Bus1 and no Taps OFF', () => {
	const input = [
					  {
					    ID: '1',
					    DateTimeUTC: '22-01-2018 13:00:00',
					    TapType: 'ON',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					  }]
  const output = processData(input) 
  it('Is a unfinished Trip', () => {	
    chai.expect(output[0].status).to.be.equal(STATUS.UNFINISHED); 
  })
  it('It costs 7.3', () => {	
    chai.expect(output[0].chargeAmount).to.be.equal(PRICE.MAX);
  })    
})

describe('Taps ON Bus1 and somehow Taps ON Bus2', () => {
	const input = [
					  {
					    ID: '1',
					    DateTimeUTC: '22-01-2018 13:00:00',
					    TapType: 'ON',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus37',
					    PAN: '34343434343434'
					  },
					  {
					    ID: '1',
					    DateTimeUTC: '23-01-2018 13:00:00',
					    TapType: 'ON',
					    StopId: 'Stop1',
					    CompanyId: 'Company1',
					    BusID: 'Bus38',
					    PAN: '34343434343434'
					  }
				    ]
  const output = processData(input) 
  it('There is a unfinished Trip', () => {	
    chai.expect(output[0].status).to.be.equal(STATUS.UNFINISHED); 
  })
  it('It costs 7.3', () => {	
    chai.expect(output[0].chargeAmount).to.be.equal(PRICE.MAX);
  })    
})


