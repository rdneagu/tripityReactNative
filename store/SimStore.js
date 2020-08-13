import * as Location from 'expo-location';
import axios from 'axios';

// const tripString = null;
const tripString = `{"from":"United Kingdom","start":"2020-07-15T16:18:53.084Z","pings":[{"coords":{"latitude":51.470921,"longitude":-0.4572175},"location":{"country":"United Kingdom","city":"Hounslow"},"time":1594829930487,"distance":0.14692372151579483,"transport":false},{"coords":{"latitude":40.49781,"longitude":-3.568886},"location":{"country":"Spain","city":"Madrid"},"time":1594829940978,"transport":true,"distance":774.011677746529},{"coords":{"latitude":40.631867,"longitude":-3.159473},"location":{"country":"Spain","city":"Guadalajara"},"time":1594829943585,"distance":37.65943787744128,"transport":false},{"coords":{"latitude":40.592773,"longitude":-3.099392},"location":{"country":"Spain","city":"Yebes"},"time":1594829946200,"distance":6.6796183762995405,"transport":false},{"coords":{"latitude":40.567204,"longitude":-3.065847},"location":{"country":"Spain","city":"Horche"},"time":1594829954399,"distance":0,"transport":false,"venue":{"id":"4e4153bb6284809c9f3d9c22","name":"Hotel La Cañada","category":"Bed & Breakfast"}},{"coords":{"latitude":40.559379,"longitude":-2.900144},"location":{"country":"Spain","city":"Peñalver"},"time":1594829957017,"distance":14.024521048796188,"transport":false},{"coords":{"latitude":40.509802,"longitude":-2.785474},"location":{"country":"Spain","city":"Auñón"},"time":1594829959616,"distance":11.148994736948959,"transport":false},{"coords":{"latitude":40.370792,"longitude":-2.450391},"location":{"country":"Spain","city":"Canalejas del Arroyo"},"time":1594829962214,"distance":32.29666676877287,"transport":false},{"coords":{"latitude":40.133921,"longitude":-2.244398},"location":{"country":"Spain","city":"Chillarón de Cuenca"},"time":1594829964823,"distance":31.61229473715948,"transport":false},{"coords":{"latitude":40.074837,"longitude":-2.135098},"location":{"country":"Spain","city":"Cuenca"},"time":1594829970047,"transport":false,"venue":{"id":"4c629f5d7c9def3b5d62d21c","name":"Bodeguilla de Basilio","category":"Spanish Restaurant"},"distance":11.383213445827064},{"coords":{"latitude":39.680191,"longitude":-1.921371},"location":{"country":"Spain","city":"Almodóvar del Pinar"},"time":1594829972895,"distance":47.521611471765034,"transport":false},{"coords":{"latitude":39.546891,"longitude":-1.510757},"location":{"country":"Spain","city":"Villargordo del Cabriel"},"time":1594829975501,"distance":38.168858328533695,"transport":false},{"coords":{"latitude":39.50452,"longitude":-1.10701},"location":{"country":"Spain","city":"Requena"},"time":1594829978117,"distance":34.947982091681354,"transport":false},{"coords":{"latitude":39.469744,"longitude":-0.424913},"location":{"country":"Spain","city":"Xirivella"},"time":1594829980730,"distance":58.66270562703787,"transport":false},{"coords":{"latitude":39.457882,"longitude":-0.346175},"location":{"country":"Spain","city":"Valencia"},"time":1594830043669,"distance":0,"transport":false,"venue":{"id":"576f860b498e38f2bc18a750","name":"Breakfast hotel primus","category":"Bakery"}},{"coords":{"latitude":39.49163,"longitude":-0.474142},"location":{"country":"Spain","city":"Manises"},"time":1594830051806,"distance":0,"transport":false,"venue":{"id":"5384da22498ecc2c32c6c7ac","name":"La Pausa","category":"Cafeteria"}},{"coords":{"latitude":41.952513,"longitude":12.504395},"location":{"country":"Italy","city":"Rome"},"time":1594830059653,"transport":true,"distance":689.2139599540621},{"coords":{"latitude":41.945706,"longitude":12.521754},"location":{"country":"Italy","city":"Rome"},"time":1594830067780,"distance":0,"transport":false,"venue":{"id":"4c6d1bf86af58cfabf728817","name":"McDonald's","category":"Fast Food Restaurant"}},{"coords":{"latitude":41.752291,"longitude":12.708956},"location":{"country":"Italy","city":"Rocca di Papa"},"time":1594830070384,"distance":26.513634997959727,"transport":false},{"coords":{"latitude":41.765272,"longitude":12.95537},"location":{"country":"Italy","city":"Valmontone"},"time":1594830081143,"distance":0,"transport":false,"venue":{"id":"4de944b4b3ad702aed3f7f30","name":"Rainbow MagicLand","category":"Theme Park"}},{"coords":{"latitude":41.661864,"longitude":13.224496},"location":{"country":"Italy","city":"Ferentino"},"time":1594830083739,"distance":25.124367137694744,"transport":false},{"coords":{"latitude":41.54891,"longitude":13.462076},"location":{"country":"Italy","city":"Ceprano"},"time":1594830086387,"distance":23.408320692985267,"transport":false},{"coords":{"latitude":41.458404,"longitude":13.796472},"location":{"country":"Italy","city":"Cassino"},"time":1594830088996,"distance":29.60965130068285,"transport":false},{"coords":{"latitude":41.374985,"longitude":14.009332},"location":{"country":"Italy","city":"Conca della Campania"},"time":1594830091615,"distance":20.027338796388133,"transport":false},{"coords":{"latitude":41.189164,"longitude":14.156696},"location":{"country":"Italy","city":"Pignataro Maggiore"},"time":1594830094235,"distance":24.053261610930235,"transport":false},{"coords":{"latitude":40.866375,"longitude":14.296949},"location":{"country":"Italy","city":"Naples"},"time":1594830146813,"distance":0,"transport":false,"venue":{"id":"4b98f62df964a520b65835e3","name":"Napoli Centrale Railway Station (INP) (Stazione Napoli Centrale)","category":"Train Station"}},{"coords":{"latitude":40.882738,"longitude":14.291067},"location":{"country":"Italy","city":"Naples"},"time":1594830154912,"distance":0,"transport":false,"venue":{"id":"5239d3f9498e5bc45cf45e8c","name":"Support Site Soccer Fields","category":"Soccer Field"}},{"coords":{"latitude":37.936535,"longitude":23.946474},"location":{"country":"Greece","city":"Spata-Loutsa"},"time":1594830162768,"transport":true,"distance":658.7192424331058},{"coords":{"latitude":37.981394,"longitude":23.909271},"location":{"country":"Greece","city":"Spata-Loutsa"},"time":1594830167989,"transport":false,"venue":{"id":"4bba15abb35776b06c7eca01","name":"Attica Zoological Park (Αττικό Ζωολογικό Πάρκο)","category":"Zoo"},"distance":6.016531015994761},{"coords":{"latitude":37.978172,"longitude":23.918233},"location":{"country":"Greece","city":"Christoypolis"},"time":1594830215535,"transport":false,"venue":{"id":"4cebe810fe90a35d4592550e","name":"Νέα Γενιά Ζηρίδη","category":"High School"},"distance":0.5552090907991367},{"coords":{"latitude":37.995667,"longitude":23.869599},"location":{"country":"Greece","city":"Leontarion"},"time":1594830218146,"distance":4.685169784715466,"transport":false},{"coords":{"latitude":38.011358,"longitude":23.810891},"location":{"country":"Greece","city":"Chalandri"},"time":1594830220787,"distance":5.431760657887514,"transport":false},{"coords":{"latitude":37.993638,"longitude":23.775872},"location":{"country":"Greece","city":"Athens"},"time":1594830223411,"distance":3.646532057642806,"transport":false},{"coords":{"latitude":37.973377,"longitude":23.717979},"location":{"country":"Greece","city":"Athens"},"time":1594830239418,"transport":false,"venue":{"id":"595dea31123a19106aee2d65","name":"Acropolis Museum Shop","category":"Museum"},"distance":0.7103681917656075},{"coords":{"latitude":37.957181,"longitude":23.701322},"location":{"country":"Greece","city":"Kallithea"},"time":1594830244696,"transport":false,"venue":{"id":"50dca4d6e4b0e3204791fb1c","name":"Momo","category":"Café"},"distance":2.3185212876991694},{"coords":{"latitude":38.011518,"longitude":23.664634},"location":{"country":"Greece","city":"Chaidari"},"time":1594830253121,"transport":false,"venue":{"id":"4f437770e4b08c6c28ebb165","name":"Παλατάκι Χαϊδαρίου","category":"Park"},"distance":0.0991780965738332},{"coords":{"latitude":38.014263,"longitude":23.636123},"location":{"country":"Greece","city":"Chaidari"},"time":1594830295223,"transport":false,"venue":{"id":"4e6c9163483b1f5ebe204fff","name":"Δάσος Χαϊδαρίου","category":"Forest"},"distance":0.925009172550524},{"coords":{"latitude":38.035846,"longitude":23.593798},"location":{"country":"Greece","city":"Aspropyrgos"},"time":1594830300476,"transport":false,"venue":{"id":"4f72d521e4b0cb5254edb7a4","name":"Ελληνικά Πετρέλαια Βιομηχανικές Εγκαταστάσεις Ασπροπύργου","category":"Factory"},"distance":4.566088995634918},{"coords":{"latitude":38.056462,"longitude":23.549424},"location":{"country":"Greece","city":"Eleusina"},"time":1594830305912,"transport":false,"venue":{"id":"4e5744243151d315926797f2","name":"112 Πτέρυγα Μάχης","category":"Military Base"},"distance":4.511533743871235},{"coords":{"latitude":51.470781,"longitude":-0.457203},"location":{"country":"United Kingdom","city":"Hounslow"},"time":1594830324452,"distance":326.6547295487474,"transport":true}],"to":"Greece","end":"2020-07-15T16:25:24.452Z"}`;

const customCoords = null;
// const customCoords = [
//   { longitude: -0.2788252, latitude: 51.4780345, name: 'boots the chemist' },
//   { longitude: -0.2793977124670783, latitude: 51.47823924939695, name: 'next clothing' },
//   { longitude: -0.27905939895135934, latitude: 51.47776632249958, name: 'marks and spencer' },
//   { longitude: -0.245903, latitude: 51.4729255, name: 'Barnes pond' },
//   { longitude: -0.24685637965494184, latitude: 51.472636945277394, name: 'Restaurant cotes' },
// ];

const trips = [
  {
    email: 'robert@sim.com',
    password: 'robertsim',
    confirmPassword: 'robertsim',
    fullName: 'Robert',
    homeCountry: 'United Kingdom',
    homeCity: 'London',
    pings: [
      { latitude: 51.4701775, longitude: -0.458971 },
      { latitude: 51.470921, longitude: -0.4572175 },
      { latitude: 50.482253, longitude: -1.462365 },
      { latitude: 47.350282, longitude: -3.846398 },
      { latitude: 43.105309, longitude: -4.472619 },
      { latitude: 40.497810, longitude: -3.568886 },
      { latitude: 40.631867, longitude: -3.159473 },
      { latitude: 40.592773, longitude: -3.099392 },
      { latitude: 40.567204, longitude: -3.065847 },
      { latitude: 40.567204, longitude: -3.065847 },
      { latitude: 40.567204, longitude: -3.065847 },
      { latitude: 40.559379, longitude: -2.900144 },
      { latitude: 40.509802, longitude: -2.785474 },
      { latitude: 40.370792, longitude: -2.450391 },
      { latitude: 40.133921, longitude: -2.244398 },
      { latitude: 40.074837, longitude: -2.135098 },
      { latitude: 40.074837, longitude: -2.135098 },
      { latitude: 39.680191, longitude: -1.921371 },
      { latitude: 39.546891, longitude: -1.510757 },
      { latitude: 39.504520, longitude: -1.107010 },
      { latitude: 39.469744, longitude: -0.424913 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.491630, longitude: -0.474142 },
      { latitude: 39.491630, longitude: -0.474142 },
      { latitude: 39.491630, longitude: -0.474142 },
      { latitude: 40.774866, longitude: 4.400616 },
      { latitude: 41.354693, longitude: 8.795147 },
      { latitude: 41.952513, longitude: 12.504395 },
      { latitude: 41.945706, longitude: 12.521754 },
      { latitude: 41.945706, longitude: 12.521754 },
      { latitude: 41.945706, longitude: 12.521754 },
      { latitude: 41.752291, longitude: 12.708956 },
      { latitude: 41.765272, longitude: 12.955370 },
      { latitude: 41.765272, longitude: 12.955370 },
      { latitude: 41.765272, longitude: 12.955370 },
      { latitude: 41.765272, longitude: 12.955370 },
      { latitude: 41.661864, longitude: 13.224496 },
      { latitude: 41.548910, longitude: 13.462076 },
      { latitude: 41.458404, longitude: 13.796472 },
      { latitude: 41.374985, longitude: 14.009332 },
      { latitude: 41.189164, longitude: 14.156696 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.882738, longitude: 14.291067 },
      { latitude: 40.882738, longitude: 14.291067 },
      { latitude: 40.882738, longitude: 14.291067 },
      { latitude: 40.088526, longitude: 16.846821 },
      { latitude: 39.234327, longitude: 19.472554 },
      { latitude: 37.936535, longitude: 23.946474 },
      { latitude: 37.980658, longitude: 23.908687 },
      { latitude: 37.981394, longitude: 23.909271 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.978172, longitude: 23.918233 },
      { latitude: 37.978172, longitude: 23.918233 },
      { latitude: 37.995667, longitude: 23.869599 },
      { latitude: 38.011358, longitude: 23.810891 },
      { latitude: 37.993638, longitude: 23.775872 },
      { latitude: 37.968454, longitude: 23.728515 },
      { latitude: 37.968454, longitude: 23.728515 },
      { latitude: 37.971499, longitude: 23.725725 },
      { latitude: 37.971499, longitude: 23.725725 },
      { latitude: 37.973377, longitude: 23.717979 },
      { latitude: 37.973377, longitude: 23.717979 },
      { latitude: 37.957181, longitude: 23.701322 },
      { latitude: 37.957181, longitude: 23.701322 },
      { latitude: 38.011678, longitude: 23.665481 },
      { latitude: 38.011885, longitude: 23.665036 },
      { latitude: 38.011518, longitude: 23.664634 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.014263, longitude: 23.636123 },
      { latitude: 38.014263, longitude: 23.636123 },
      { latitude: 38.029120, longitude: 23.597832 },
      { latitude: 38.035846, longitude: 23.593798 },
      { latitude: 38.056462, longitude: 23.549424 },
      { latitude: 38.056462, longitude: 23.549424 },
      { latitude: 38.306897, longitude: 21.678476 },
      { latitude: 38.800908, longitude: 19.937143 },
      { latitude: 40.755306, longitude: 13.056955 },
      { latitude: 44.941217, longitude: 6.333323 },
      { latitude: 48.813860, longitude: 1.499338 },
      { latitude: 51.470781, longitude: -0.457203 },
      { latitude: 51.470781, longitude: -0.457203 },
    ]
  }
]

/**
 * Gets distance in kilometers between two points
 *
 * @param {*} lat1 
 * @param {*} lat2 
 * @param {*} lon1 
 * @param {*} lon2 
 */
function getDistanceBetweenPoints(from, to) {
  const lat1 = from.latitude;
  const lon1 = from.longitude;
  const lat2 = to.latitude;
  const lon2 = to.longitude;
  // φ is latitude
  // λ is longitude
  // R is earth’s radius (mean radius = 6,371km)
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance / 1000;
}

const FLIGHT_DISTANCE_TRIGGER_THRESHOLD = 80;
const TRIP_DISTANCE_TRIGGER_THRESHOLD = 40;

class SimStore {
  selectedTrip = 0;
  pingNum = 0;
  ping = {
    previous: null,
    current: null,
  };
  trip = false;
  home = {};

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  simulatePing() {
    return trips[this.selectedTrip].pings[this.pingNum++];
  }
  
  async getHomeLocation() {
    const { homeCountry, homeCity } = trips[this.selectedTrip];
    const [ coords ] = await Location.geocodeAsync(`${homeCountry}, ${homeCity}`);

    if (!coords) {
      throw 'Failed to set home location';
    }

    return {
      country: homeCountry,
      city: homeCity,
      coords,
    };
  }

  isDayTripSkipped() {
    return true;
  }

  isHome() {
    const distance = getDistanceBetweenPoints(this.ping.current.coords, this.home.coords);
    return (distance < TRIP_DISTANCE_TRIGGER_THRESHOLD);
  }

  isInFlight() {
    const { distance, location } = this.ping.current;
    return (distance > FLIGHT_DISTANCE_TRIGGER_THRESHOLD || location.city === null);
  }

  async runCustomCoords() {
    let n = 0;
    while (n < customCoords.length) {
      const coords = customCoords[n++];
      const location = await Location.reverseGeocodeAsync(coords);
      console.log(' ');
      console.log(`\u001b[36m    Coord #${n}\u001b[0m`);
      console.log(`    \u001b[36m${location[0].country}, ${location[0].region}, ${location[0].city}\u001b[0m`);
      console.log(`    \u001b[36m${location[0].name}, ${location[0].street}, ${location[0].postalCode}\u001b[0m`);
      console.log(`Expected venue is: \u001b[32m${coords.name}\u001b[0m`);
      const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${coords.latitude},${coords.longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
      const venueResponse = venueRequest.data.response.venues;
      venueResponse.splice(3, venueResponse.length);
      console.log(`Top 3 venues found at location \u001b[35m${coords.latitude}\u001b[0m lat \u001b[35m${coords.longitude}\u001b[0m lon:`);
      venueResponse.forEach((venue, i) => {
        console.log(`\u001b[33m    Venue ${i + 1}: ${venue.name} (distance from input ${venue.location.distance}m)\u001b[0m`);
      })
    }
  }

  async run(finished) {
    try {
      console.log('\u001b[36m    Running trip simulator\u001b[0m\n');

      if (customCoords) {
        console.log('\u001b[36m    Running custom coords\u001b[0m\n');
        await this.runCustomCoords();
        console.log(`\u001b[32m✓   Custom coords finished\u001b[0m\n`);
      }

      this.home = await this.getHomeLocation();
      console.log(`\u001b[32m✓   Home location set\u001b[0m`);
      console.log(`\u001b[36m       Country: '${this.home.country}'\u001b[0m`);
      console.log(`\u001b[36m       City: '${this.home.city}'\u001b[0m`);
      console.log(`\u001b[36m       Coords: '${this.home.coords.latitude} lat, ${this.home.coords.longitude} lon'\u001b[0m`);
      
      const fetchLocation = async () => {
        if (tripString) {
          return finished(JSON.parse(tripString));
        }
        
        const coords = this.simulatePing();
        const location = await Location.reverseGeocodeAsync(coords);
        this.ping.current = {
          coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
          location: {
            country: location[0].country,
            city: location[0].city,
          },
          time: Date.now(),
          distance: 0,
          transport: false,
        }

        if (this.ping.previous) {
          this.ping.current.distance = getDistanceBetweenPoints(this.ping.previous.coords, coords);
          this.ping.current.transport = this.isInFlight();
        }

        console.log(this.ping.current.location.city);

        // If the trip has not been started yet and the location of the ping is distanced from home by 20km
        if (!this.trip && !this.isHome()) {
          const firstPing = { ...this.ping.previous };
          delete firstPing.prev;

          console.log('\nLooks like you have embarked on a new journey!');
          console.log('Your trip log will be automatically recorded until you get back home!');
          console.log('If this is trip is a business meeting or not a valid trip, please confirm so to stop logging your destinations until you get back home!\n');

          // Define the trip start
          this.trip = {
            from: this.ping.previous.location.country,
            start: new Date(this.ping.current.time),
            pings: [ firstPing ],
          }
        }

        if (this.trip) {
          // If the trip has been started
          if (this.ping.current.distance < 0.2 || (this.ping.current.transport && this.ping.previous.transport)) {
            // If the previous and current ping distance difference is less than 1km or previous and current ping transport are true
            // Request the venue details if not in a flight and the venue data hasn't been requested yet
            this.ping.current.venue = this.ping.previous.venue;
            if (!(this.ping.current.transport || this.ping.previous.transport) && !this.ping.current.venue) {
              const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${this.ping.previous.coords.latitude},${this.ping.previous.coords.longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
              const [ venueResponse ] = venueRequest.data.response.venues;
              this.ping.current.venue = { 
                id: venueResponse.id,
                name: venueResponse.name,
                category: venueResponse.categories[0].name,
              };
              console.log(`\u001b[36m       Venue: '${venueResponse.name}'\u001b[0m`);
            }

            const merge = {
              ...this.ping.current,
              distance: this.ping.current.distance + this.ping.previous.distance,
              transport: this.ping.previous.transport,
            }
            // Replace the previous ping with the current ping
            this.trip.pings.splice(this.trip.pings.length - 1, 1, merge);
          } else {
            // Else just push the ping to the list
            this.trip.pings.push(this.ping.current);
          }
        
          // If the location is not in a flight and is not the home country, set the destination country
          if (!this.isInFlight() && this.ping.current.location.country !== this.home.country) {
            this.trip.to = this.ping.current.location.country;
          }

          // If the location is not in a flight and is closer than 20km to home then end the trip
          if (!this.isInFlight() && this.isHome()) {
            this.trip.end = new Date(this.ping.current.time);

            if (this.trip.end - this.trip.start < 86400 * 1000 && this.isDayTripSkipped()) {
              // The user must confirm if the trip is valid when the result is under 24 hours
              console.log('\nYour account is not saving the day trips at the moment');
              console.log('If you want to save your day trips please check your account settings');
              console.log('\u001b[36mThis trip will be temporarily saved on your device until you decide to sync it or remove it\u001b[0m\n');
            }

            if (typeof (finished) === 'function') {
              console.log(JSON.stringify(this.trip));
              console.log(`\u001b[32m✓   Trip simulator completed\u001b[0m`);
              return finished(this.trip);
            }
          }          
        }

        this.ping.previous = {
          prev: this.ping.previous,
          ...this.ping.current,
        }

        setTimeout(fetchLocation, 2500);
      }

      fetchLocation();
    } catch(e) {
      console.error(`\u001b[31;1mx   ${e}\u001b[0m`);
    }
  }
}

export default new SimStore();
