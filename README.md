# Travel Stops

`npm install`

## To Run

`npm run start`

Sample Inputs:

```csv
ID, DateTimeUTC, TapType, StopId, CompanyId, BusID, PAN
1, 22-01-2018 13:00:00, ON, Stop1, Company1, Bus37, 34343434343434
2, 22-01-2018 13:05:00, OFF, Stop2, Company1, Bus37, 34343434343434
3, 23-01-2018 13:00:00, ON, Stop2, Company2, Bus37, 4444333322221111 
4, 23-01-2018 13:05:00, OFF, Stop3, Company2, Bus37, 4444333322221111
5, 24-01-2018 13:00:00, ON, Stop2, Company2, Bus37, 34343434343434
6, 24-01-2018 13:05:00, OFF, Stop3, Company2, Bus38, 34343434343434
7, 25-01-2018 13:00:00, ON, Stop1, Company1, Bus37, 3528000700000000 
8, 25-01-2018 13:05:00, ON, Stop1, Company1, Bus37, 3528000700000000
9, 26-01-2018 13:05:00, ON, Stop1, Company1, Bus37, 3528000700000000
10, 26-01-2018 13:05:00, ON, Stop1, Company1, Bus37, 5019717010103742
11, 26-01-2018 13:05:00, OFF, Stop1, Company1, Bus37, 5019717010103742
12, 24-01-2018 13:00:00, ON, Stop1, Company2, Bus37, 34343434343434
13, 24-01-2018 13:05:00, OFF, Stop3, Company2, Bus37, 34343434343434
```


Sample Results:

```csv
started,finished,durationSecs,fromStop,toStop,chargeAmount,companyId,busId,PAN,status
22-01-2018 13:00:00,22-01-2018 13:05:00,300,Stop1,Stop2,3.25,Company1,Bus37,34343434343434,completed
24-01-2018 13:00:00,24-01-2018 13:05:00,300,Stop2,Stop3,7.3,Company2,Bus37,34343434343434,completed
24-01-2018 13:00:00,24-01-2018 13:05:00,300,Stop1,Stop3,7.3,Company2,Bus37,34343434343434,completed
23-01-2018 13:00:00,23-01-2018 13:05:00,300,Stop2,Stop3,5.5,Company2,Bus37,4444333322221111,completed
25-01-2018 13:00:00,,,Stop1,,7.3,Company1,Bus37,3528000700000000,unfinished
26-01-2018 13:05:00,,,Stop1,,7.3,Company1,Bus37,3528000700000000,unfinished
26-01-2018 13:05:00,26-01-2018 13:05:00,0,Stop1,Stop1,0,Company1,Bus37,5019717010103742,cancelled
```

## To Test

`npm run test`

Test Cases:

```shell
  Taps ON Stop1 and Taps OFF Stop 2
    ✓ Is a complete Trip
    ✓ It costs 3.25
    ✓ Duration calculates right

  Taps ON Stop1 and Taps OFF Stop 3
    ✓ Is a complete Trip
    ✓ It costs 7.3
    ✓ Duration calculates right

  Taps ON Stop2 and Taps OFF Stop 3
    ✓ Is a complete Trip
    ✓ It costs 5.5

  Taps ON Stop1 and Taps OFF Stop 1
    ✓ Is a cancelled Trip
    ✓ It costs 0

  Taps ON Bus1 and Taps OFF Bus2 (at different stop)
    ✓ Is a completed Trip
    ✓ It costs 7.3

  Taps ON Bus1 and Taps OFF Bus2 (at the same stop)
    ✓ Is a cancelled Trip
    ✓ It costs 0

  Taps ON Bus1 and no Taps OFF
    ✓ Is a unfinished Trip
    ✓ It costs 7.3

  Taps ON and somehow Taps ON again
    ✓ There is a unfinished Trip
    ✓ It costs 7.3


  18 passing (6ms)
  ```


