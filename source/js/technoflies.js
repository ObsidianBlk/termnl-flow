

if (typeof(window.RenderLoop) !== 'undefined'){
  window.TechnoFlies = (function(){ 
    var running = false;
    var cnv = null;
    var ctx = null;

    var minParticleSize = 20;
    var maxParticleSize = 60;
    var maxParticleSpeed = 50;
    var minParticleSpeed = 10;
    var minParticleDistance = 30;
    var maxParticleDistance = 80;
    var maxParticles = 60;
    var particles = [];

    // Set-able variables.
    var boxSize = 10;
    var boxSpacing = 2;
    var boxColor = [0,0,0];
    var edgeColor = [96,96,96];
    var glowColor = [255,255,255];

    // Computed variables.
    var boxCountH = 0;
    var boxCountV = 0;
    var renderXOffset = 0;
    var renderYOffset = 0; 



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
        return (this.i * this.i) + (this.j * this.j);
      }

      this.length = function(){
        return Math.sqrt(this.lensq());
      }

      this.normalize = function(){
        var l = this.length();
        if (l !== 0){
          this.i /= l;
          this.j /= l;
        }
        return this;
      }

      this.invert = function(){
        this.i = -this.i;
        this.j = -this.j;
        return this;
      }

      this.add = function(v){
        if (v instanceof vec2d){
          this.i += v.i;
          this.j += v.j;
        }
        return this;
      }

      this.multv = function(v){
        if (v instanceof vec2d){
          this.i *= v.i;
          this.j *= v.j;
        }
        return this;
      }

      this.mults = function(s){
        if (typeof(s) === "number"){
          this.i *= s;
          this.j *= s;
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
        if (Math.random() < 0.5)
          this.y = h;
      } else {
        this.y = Math.floor(Math.random() * h);
        if (Math.random() < 0.5)
          this.x = w;
      }

      this.s = minParticleSpeed + (Math.random() * (maxParticleSpeed - minParticleSpeed));
      this.v = new vec2d();
      this.v.i = (w*0.5) - this.x;
      this.v.j = (h*0.5) - this.y;
      this.v.normalize();

      this.sz = minParticleSize + (Math.random()*(maxParticleSize - minParticleSize));

      this.distanceTo = function(x, y){
        var dv = (new vec2d()).set(
          x - this.x,
          y - this.y
        );
        return dv.length();
      }

      this.strengthAt = function(x, y){
        var d = this.distanceTo(x,y);
        if (d <= this.sz){
          return 1.0 - (d / this.sz);
        }
        return 0;
      }

      this.force = function(p){
        if (!this.alive){return;}
        if (!(p instanceof particle)){return;}

        var dv = (new vec2d()).set(
          p.x - this.x,
          p.y - this.y
        );
        var d = dv.length();

        if (d < maxParticleDistance){
          this.v.mults(this.s);
          dv.normalize();

          var f = 0;
          if (d < minParticleDistance){ // Repel
            dv.invert(); // Invert the directional vector to push away from the other particle.
            // How much force are we using to push (between 0 and 1)
            f = 1.0 - (d / minParticleDistance); 
          } else { // Attract
            f = (d-minParticleDistance)/(maxParticleDistance - minParticleDistance);
          }
          f *= 0.1; // Weaken the force by a lot
          dv.mults(f * this.s); // Push away/toward at some fraction of the particles speed.
          this.v.add(dv);
        }
      }

      this.update = function(delta){
        if (!this.alive){return;}

        this.v.normalize();
        var dv = this.v.clone().mults(this.s * delta);
        this.x += dv.i;
        this.y += dv.j;

        if (this.x < 0 || this.y < 0 || this.x > w || this.y > h)
          this.alive = false;
      }
    }


    // -------------------------------------------------
    // ------------------------------------------------- 


    // ---------------
    // NOTE: The next three functions were borrowed from...
    // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
      return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    } 

    function hexToRgb(hex) {
      // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
      });

      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }
    // -------------
    // Back to my stuff!!
    
    function rgbArrToHex(rgb){
      return rgbToHex(rgb[0], rgb[1], rgb[2]);
    }
    

    function ColorAtPoint(x, y){
      var str = 0;
      particles.forEach((p) => {
        str += p.strengthAt(x,y);
      });
      str = Math.min(1.0, str);
      var istr = 1.0 - str;
      return [
        Math.min(255, Math.floor((edgeColor[0] * istr) + (glowColor[0] * str))),
        Math.min(255, Math.floor((edgeColor[1] * istr) + (glowColor[1] * str))),
        Math.min(255, Math.floor((edgeColor[2] * istr) + (glowColor[2] * str)))
      ];
    }

    function RenderLine(x1, y1, x2, y2, c1, c2){
      ctx.save();

      var grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      ctx.stroke();

      ctx.restore();
    }

    function RenderBox(x, y){
      ctx.save();
      ctx.fillStyle = rgbToHex(boxColor[0], boxColor[1], boxColor[2]);
      ctx.fillRect(x + boxSpacing, y + boxSpacing, boxSize, boxSize);
      ctx.restore();

      var xl = x + boxSpacing;
      var xr = xl + boxSize;
      var yt = y + boxSpacing;
      var yb = yt + boxSize;

      var ctl = rgbArrToHex(ColorAtPoint(xl, yt));
      var ctr = rgbArrToHex(ColorAtPoint(xr, yt));
      var cbr = rgbArrToHex(ColorAtPoint(xr, yb));
      var cbl = rgbArrToHex(ColorAtPoint(xl, yb));

      RenderLine(xl, yt, xr, yt, ctl, ctr);
      RenderLine(xr, yt, xr, yb, ctr, cbr);
      RenderLine(xr, yb, xl, yb, cbr, cbl);
      RenderLine(xl, yb, xl, yt, cbl, ctl);
    }

    function Update(delta){
      if (!running || cnv === null || ctx === null){return;}

      if (cnv.width !== cnv.clientWidth || cnv.height !== cnv.clientHeight){
        cnv.width = cnv.clientWidth;
        cnv.height = cnv.clientHeight;
        CalculateBoxRendering();
      }

      while (particles.length < maxParticles)
        particles.push(new particle(cnv.width, cnv.height));
      for (let i=0; i < particles.length; i++){
        for (let j=i+1; j < particles.length; j++){
          particles[i].force(particles[j]);
          particles[j].force(particles[i]);
        }
      }
      particles.forEach((p)=>{p.update(delta);});
      particles = particles.filter((p)=>{return p.alive;});

      ctx.clearRect(0,0,cnv.width, cnv.height);

      var bs = boxSize + (2 * boxSpacing);
      var y = renderYOffset;

      for (let j=0; j < boxCountV; j++){
        var x = renderXOffset
        for (let i=0; i < boxCountH; i++){
          RenderBox(x, y);
          x += bs;
        }
        y += bs;
      }
    }
    window.RenderLoop.register(Update);



    // -------------------------------------------------
    // -------------------------------------------------
    

    function CalculateBoxRendering(){
      var bs = boxSize + (2 * boxSpacing);
      boxCountH = Math.floor(cnv.width / bs);
      boxCountV = Math.floor(cnv.height / bs);
      renderXOffset = Math.floor((cnv.width - (bs * boxCountH)) * 0.5);
      renderYOffset = Math.floor((cnv.height - (bs * boxCountV)) * 0.5);
    }
    
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
        var _cnv = document.querySelector("canvas" + (((isclass) ? "." : "#") + name));
        if (_cnv){
          ctx = _cnv.getContext("2d");
          if (ctx){
            let restart = false;
            if (cnv !== null){
              TechnoFlies.stop();
              restart = true;
            }
            cnv = _cnv;
            if (restart)
              TechnoFlies.start();
          } else {
            ctx = null;
            if (cnv !== null)
              ctx = cnv.getContext("2d");
          }
        }
      }
    };

    return TechnoFlies;
  })();
} else {
  console.error("RenderLoop not found. TechnoFlies not loaded.");
}




