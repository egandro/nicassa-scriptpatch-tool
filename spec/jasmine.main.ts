
let Jasmine = require('jasmine');

main();

async function main() {
   let run = new Jasmine();

   run.loadConfigFile('./spec/jasmine.json');
   run.onComplete((passed: any) => {
      if (passed) {
         console.log('all specs have passed');
         finish(0);
      }
      else {
         console.log('at least one spec has failed');
         finish(-1);
      }
   });

   run.execute();
}

async function finish(code: any) {
   console.log('done');
   process.exit(code);
}

