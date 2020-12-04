A scenario object can have the next key: value properties:

`name` - The name of the scenario
`type` - The type of the scenario, supported types are: 'coords', 'real', 'media'
`country` - Sets the home location of the simulator -- *ignored if type is 'coords'*
`city` - Sets the home city of the simulator -- *ignored if type is 'coords'*
`interval` - The interval between pings -- *only used when type is 'real'*
`pings` - An array of key-value objects

Each ping must start with a dash (`-`), that means the beginning of a new item and the way to separate pings. A ping object can have the next `key: value` properties:

`latitude` - The latitude of ping location
`longitude` - The longitude of the ping location
`altitude` - The altitude of the ping location -- *set to 0 or skip if unknown*
`timeOffset` - Time spent around this location -- *ignored if type is 'coords'*
`photos` - The amount of photos taken at location -- *only used when type is 'media'*
`expectedVenue` - The venue that you expect foursquares to return -- *only used when type is 'coords'*

## *coords* scenario example
This scenario can the pings in any order. It just parses the venues and detects if they are accurate or not
```
name: 'Some Italy coords'               <-- the name
type: 'coords'                          <-- the type of the scenario
pings:                                  <-- the array of objects named pings
  - latitude: 55.86565599709542         <-- note the dash and colon spacing
    longitude: -4.256483458422198
    altitude: 0                         <-- altitude, set to 0 or skip if unknown
    expectedVenue: 'citizenM Glasgow'
  - latitude: 55.86360903165831         <-- note the dash again, new item
    longitude: -4.264894865603752
    expectedVenue: 'Malmaison Glasgow'
```
See file `__scenario__/coords_scenario_example.yml` for full working example

## *real* scenario example
This scenario must have some sort of logical path between pings. Assumes a real world case
```
name: 'Trip to Italy, France, Spain'    <-- the name
type: 'real'                            <-- the type of the scenario
country: 'United Kingdom'               <-- home country
city: 'London'                          <-- home city
interval: 900                           <-- interval between pings, 
pings:                                  <-- the array of objects named pings
  - latitude: 55.86565599709542         <-- note the dash and colon spacing
    longitude: -4.256483458422198
    altitude: 3000
    timeOffset: 0
  - latitude: 39.680191
    longitude: -1.921371
    altitude: 0
    timeOffset: 15
```
See file `__scenario__/real_scenario_example.yml` for full working example

## *media* scenario example
This scenario must have some sort of logical path between pings. Assumes a real past trip that is parsed from photos
```
name: 'Past trips #1'                   <-- the name
type: 'media'                           <-- the type of the scenario
country: 'United Kingdom'               <-- home country
city: 'London'                          <-- home city
pings:                                  <-- the array of objects named pings
  - latitude: 55.86565599709542         <-- note the dash and colon spacing
    longitude: -4.256483458422198
    altitude: 3000
    photos: 1                           <-- the amount of photos taken at location
    timeOffset: 15                      <-- time spent to take the amount of photos specified
  - latitude: 39.49163
    longitude: -0.474142
    altitude: 0
    timeOffset: 120
    photos: 20
```
See file `__scenario__/media_scenario_example.yml` for full working example

## Notes

You have to add a space after the colon (`:`) and after the dash (`-`). I am not sure if indenting is necessary but helps to understand the nesting level (clearly shows that name, type and pings belong to scenario)

You can only have 1 scenario per file. There are multiple types of scenario that the system can handle at the moment but this is the only one tested (type 0 - coords only).

The filename should have a `.y(a)ml` extension, I do not guarantee that a different name extension will not crash the application (e.g. `coords_case_one.yml`)