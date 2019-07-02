

if (typeof(window.RenderLoop) !== 'undefined'){
  window.TechnoFlies = (function(){ 
    var running = false;
    var cnv = null;
    var ctx = null;

    var maxParticleSpeed = 5;
    var minParticleSpeed = 2;
    var minParticleDistance = 4;
    var maxParticleDistance = 10;
    var particles = [];

    function vec2d(){
      this.i = 0;
      this.j = 0;

      this.set = function(i, j){
        if (i instanceof vec2d){
          this.i = i.i;
          this.j = i.j;
        } else {
          if (typeof(i) === 'number')
            this.i = i;
          if (typeof(j) === 'number')
            this.j = j;
        }
        return this;
      }

      this.lensq = function(){
        return (i * i) + (j * j);
      }

      this.length = function(){
        return Math.sqrt(this.lensq());
      }

      this.normalize = function(){
        var l = this.length();
        if (l !== 0){
          i /= length;
          j /= length;
        }
        return this;
      }

      this.invert = function(){
        i = -i;
        j = -j;
        return this;
      }

      this.add = function(v){
        if (v instanceof vec2d){
          i += v.i;
          j += v.j;
        }
        return this;
      }

      this.multv = function(v){
        if (v instanceof vec2d){
          i *= v.i;
          j *= v.j;
        }
        return this;
      }

      this.mults = function(s){
        if (typeof(s) === "number"){
          i *= s;
          j *= s;
        }
        return this;
      }

      this.clone = function(){
        return (new vec2d()).set(this);
      }
    }

    // -------------------------------------------------
    // -------------------------------------------------


    function particle(w, h){
      this.alive = true;
      this.x = 0;
      this.y = 0;

      if (Math.random() < 0.5){
        this.x = Math.floor(Math.random() * w);
      } else {
        this.y = Math.floor(Math.random() * h);
      }

      this.s = minParticleSpeed + (Math.random() * (maxParticleSpeed - minParticleSpeed));
      this.v = new vec2d();
      this.v.i = (w*0.5) - this.x;
      this.v.j = (h*0.5) - this.y;
      this.v.normalize();

      this.force = function(p){
        if (!this.alive){return;}
        if (!(p instanceof particle)){return;}

        var dv = (new vec2d()).set(
          p.x - this.x,
          p.y - this.y
        );
        var d = dv.length;

        if (d < maxParticleDistance){
          dv.normalize();

          var f = 0;
          if (d < minParticleDistance){ // Repel
            dv.invert(); // Invert the directional vector to push away from the other particle.
            // How much force are we using to push (between 0 and 1)
            f = 1.0 - (d / minParticleDistance); 
          } else { // Attract
            f = (d-minParticleDistance)/(maxParticleDistance - minParticleDistance);
          }
          dv.mults(f * this.s); // Push away/toward at some fraction of the particles speed.
          this.v.add(dv);
        }
      }

      this.update = function(delta){
        if (!this.alive){return;}

        this.v.normalize();
        var dx = this.v.i * this.s * delta;
        var dy = this.v.j * this.s * delta;
        this.x += dx;
        this.y += dy;

        if (this.x < 0 || this.y < 0 || this.x > w || this.y > h)
          this.alive = false;
      }
    }


    // -------------------------------------------------
    // ------------------------------------------------- 

    function Render(delta){
      if (!running || cnv === null || ctx === null){return;}

      // Drawing Operations go here!!!
    }
    window.RenderLoop.register(Render);



    // -------------------------------------------------
    // -------------------------------------------------
    
    var TechnoFlies = {
      start: function(){
        running = true;
      },

      stop: function(){
        running = false;
        particles = [];
      },

      isRunning: function(){return running;},

      setCanvas: function(name, isclass){
        if (cnv !== null){
          TechnoFlies.stop();
          cnv = null;
          ctx = null;
        }
        // Do a query selection to get the canvas!
      }
    };

    return TechnoFlies;
  })();
} else {
  console.error("RenderLoop not found. TechnoFlies not loaded.");
}




