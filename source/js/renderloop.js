
window.RenderLoop = (function(){
  var CBL = [];
  var fps = 1000.0/60.0 // 60 FPS target.
  var initTime = null;
  var lastTime = null;
  var dtmon = [];
  var dtmonmax = 10;
  var running = false;

  function DTMonitor(dt){
    dtmon.push(dt);
    if (dtmon.length > dtmonmax){
      dtmon.splice(0, 1);
    }
  }

  function CallCBL(dt){
    for (let i=0; i < CBL.length; i++)
      CBL[i].cb.call(CBL[i].owner, dt);
  }

  function heartbeat(timestamp){
    var dt = 0;
    if (!initTime){
      initTime = timestamp;
      lastTime = timestamp;
    } else {
      dt = timestamp - lastTime;
      lastTime = timestamp;
    }
    DTMonitor(dt);

    CallCBL(dt);

    if (running)
      window.requestAnimationFrame(heartbeat);
  }




  var RenderLoop = {
    start: function(){
      if (!running){
        running = true;
        window.requestAnimationFrame(heartbeat);
      }
      return RenderLoop;
    },

    stop: function(){
      running = false;
      initTime = null;
      lastTime = null;
      dtaccum = 0;
      dtmon = [];
      return RenderLoop;
    },

    isRunning: function(){return running;},

    register: function(cb, owner){
      CBL.push({
        cb:cb,
        owner:owner
      });
      return RenderLoop;
    },

    unregister: function(cb, owner){
      CBL = CBL.filter((item)=>{
        return (item.cb !== cb || item.owner !== owner);
      });
      return RenderLoop;
    },

    lastDelta: function(){
      return (dtmon.length > 0) ? dtmon[dtmon.length-1] : 0;
    },

    deltaSinceStart: function(){
      return (initTime) ? lastTime - initTime : 0;
    },

    avgFPS: function(){
      if (dtmon.length > 0){
        var t = dtmon.reduce((accum, v)=>accum+v);
        return ((dtmon.length/t)*1000)
      }
      return 0;
    }
  }

  return RenderLoop;
})();


