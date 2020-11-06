const yaml = require('js-yaml');
const fs = require('fs');

try {
  fs.readFile('./scenario_1.scn', { encoding: 'UTF-8' }, (err, data) => {
    if (err) {
      throw err;
    }

    const scenarioLines = data.split('\n');
    const scenario = {
      name: null,
      country: null,
      city: null,
      pings: [],
    };
    for (let i = 0; i < scenarioLines.length; i++) {
      const line = scenarioLines[i];
      const [ key, value ] = line.split(':');
      if (key === 'Ping') {
        const coords = value.split(',');
        if (coords.length < 4) {
          throw `Line ${i} failed, values missing from the ping`;
        }

        let latitude = Number.parseFloat(coords[0]);
        let longitude = Number.parseFloat(coords[1]);
        let altitude = Number.parseFloat(coords[2]) || 0;
        let timeOffset = Number.parseInt(coords[3]);
        let expectedVenue = null;
      
        scenario.pings.push({
          latitude,
          longitude,
          altitude,
          timeOffset,
          expectedVenue,
        });
        continue;
      }
      scenario[key.toLowerCase().trim()] = value.trim();
    }
    const yamlDump = yaml.safeDump({ scenario });
    fs.writeFile('./scenario_1.yml', yamlDump, (err) => {
      if (err) {
        throw err;
      }
      console.log('saved!');
    })
  });
} catch(e) {
  console.error(e);
}