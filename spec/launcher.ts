function testAsync(runner) {
   return (done) => {
       runner().then(() => { done(); })
           .catch((err) => { fail(err); done(err); });
   };
}

// hack for making a function global
(<any>global).testAsync = testAsync;

require('./jasmine.main.ts');
