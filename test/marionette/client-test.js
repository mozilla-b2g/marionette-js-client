var Client, cmds;

cross.require(
  'marionette/client',
  'Marionette.Client', function(obj){
    Client = obj;
  }
);

cross.require(
  'marionette/example-commands',
  'Marionette.ExampleCommands',
  function(obj){
    cmds = obj;
  }
);

function MockBackend(){
  this.sent = [];
  this.queue = [];
}

MockBackend.prototype = {

  connectionId: 0,

  reset: function(){
    this.sent.length = 0;
    this.queue.length = 0;
  },

  send: function(cmd, cb){
    this.sent.push(cmd);
    this.queue.push(cb);
  },

  respond: function(cmd){
    if(this.queue.length){
      (this.queue.shift())(cmd);
    }
  }

};

describe("marionette/client", function(){

  var subject, backend, cb, cbResponse;

  beforeEach(function(){
    backend = new MockBackend();
    subject = new Client(backend);
    cb = function(){
      cbResponse = arguments;
    };
  });

  describe("initialization", function(){
    it("should save .backend", function(){
      expect(subject.backend).to.be(backend);
    });
  });

  describe(".startSession", function(){
    beforeEach(function(done){

      subject.startSession(function(){
        done();
      });

      backend.respond(cmds.getMarionetteIDResponse());
      backend.respond(cmds.newSessionResponse());
    });

    it("should have actor", function(){
      expect(subject.actor).to.be.ok();
    });

    it("should have a session", function(){
      expect(subject.session).to.be.ok();
    });
  });

  describe("._getActorId", function(){
    var response;

    beforeEach(function(done){
      response = cmds.getMarionetteIDResponse();
      subject._getActorId(function(){
        cbResponse = arguments;
        done();
      });

      backend.respond(response);
    });

    it("should send getMarionetteID", function(){
      expect(backend.sent[0].type).to.be('getMarionetteID');
    });

    it("should save actor id", function(){
      expect(subject.actor).to.be(response.id);
    });

    it("should send callback response", function(){
      expect(cbResponse[0]).to.eql(response);
    });

  });


  describe("._newSession", function(){
    var response;

    beforeEach(function(done){
      response = cmds.newSessionResponse();
      subject._newSession(function(){
        cbResponse = arguments;
        done();
      });

      backend.respond(response);
    });

    it("should send newSession", function(){
      expect(backend.sent[0].type).to.eql('newSession');
    });

    it("should save session id", function(){
      expect(subject.session).to.be(response.value);
    });

    it("should send callback response", function(){
      expect(cbResponse[0]).to.eql(response);
    });

  });

  describe(".send", function(){

    describe("when session: is present", function(){
      beforeEach(function(){
        subject.session = 'session';
        subject.actor = 'actor';
        subject.send({ type: 'newSession' });
      });

      it("should add session to cmd", function(){
        expect(backend.sent[0]).to.eql({
          to: subject.actor,
          session: subject.session,
          type: 'newSession'
        });
      });
    });

    describe("when to: is not given", function(){

      describe("with an actor", function(){
        beforeEach(function(){
          subject.actor = 'foo';
          subject.send({ type: '_getActorId' }, cb);
        });

        it("should add to:", function(){
          expect(backend.sent[0]).to.eql({
            to: 'foo',
            type: '_getActorId'
          });
        });

      });

      describe("without an actor", function(){
        beforeEach(function(){
          subject.send({ type: '_getActorId' }, cb);
        });

        it("should add to:", function(){
          expect(backend.sent[0]).to.eql({
            to: 'root',
            type: '_getActorId'
          });
        });

      });

    });
  });

});
