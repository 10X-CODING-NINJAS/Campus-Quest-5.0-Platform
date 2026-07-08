const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

fs.createReadStream(path.join(__dirname, 'src', 'Assets', 'Spidey sense usage.png'))
  .pipe(new PNG())
  .on('parsed', function() {
    let topOfButton = 0;
    
    // Scan upwards from the bottom (77.64%)
    const startY = Math.floor(this.height * 0.776);
    
    for (let y = startY; y > 0; y--) {
      let foundRed = false;
      for (let x = Math.floor(this.width * 0.5); x < this.width; x++) {
        const idx = (this.width * y + x) << 2;
        const r = this.data[idx];
        const g = this.data[idx+1];
        const b = this.data[idx+2];
        const a = this.data[idx+3];
        
        if (a > 200 && r > 100 && g < 40 && b < 40) {
          foundRed = true;
          break;
        }
      }
      
      if (!foundRed) {
        topOfButton = y;
        break;
      }
    }
    
    console.log(`Top of the button is at: ${(topOfButton / this.height * 100).toFixed(2)}%`);
  });
