document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const imageEditor = document.getElementById('image-editor');
    const image = document.getElementById('image');
    const pixelReductionSlider = document.getElementById('pixel-reduction');
    const pixelReductionValue = document.getElementById('pixel-reduction-value');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    const saveButton = document.getElementById('save-btn');
    const resetButton = document.getElementById('reset-btn');
    let cropper;
    let originalImage;
  
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });
  
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
  
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false);
      document.body.addEventListener(eventName, highlight, false);
    });
  
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false);
      document.body.addEventListener(eventName, unhighlight, false);
    });
  
    function highlight() {
      dropArea.classList.add('highlight');
    }
  
    function unhighlight() {
      dropArea.classList.remove('highlight');
    }
  
    dropArea.addEventListener('drop', handleDrop, false);
    document.body.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files), false);
  
    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    }
  
    function handleFiles(files) {
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
          image.src = e.target.result;
          originalImage = e.target.result;
          dropArea.style.display = 'none';
          imageEditor.style.display = 'flex';
          initCropper();
        }
        reader.readAsDataURL(file);
      }
    }
  
    function initCropper() {
      if (cropper) {
        cropper.destroy();
      }
      cropper = new Cropper(image, {
        viewMode: 1,
        crop: updateOutputInfo
      });
      const img = new Image();
      img.onload = function() {
        document.getElementById('original-size').textContent = `${this.width} x ${this.height}`;
        updateOutputInfo();
      }
      img.src = image.src;
    }
  
    function updateOutputInfo() {
      if (!cropper) return;
      const cropData = cropper.getData();
      const cropWidth = Math.round(cropData.width);
      const cropHeight = Math.round(cropData.height);
      const pixelReduction = parseInt(pixelReductionSlider.value) / 100;
  
      const finalWidth = Math.round(cropWidth * pixelReduction);
      const finalHeight = Math.round(cropHeight * pixelReduction);
      document.getElementById('crop-size').textContent = `${finalWidth} x ${finalHeight}`;
      
      const printWidthCm = ((finalWidth / 300) * 2.54).toFixed(2).replace('.', ',');
      const printHeightCm = ((finalHeight / 300) * 2.54).toFixed(2).replace('.', ',');
      document.getElementById('print-size').textContent = `${printWidthCm} x ${printHeightCm} cm`;
      
      const gcd = (a, b) => b ? gcd(b, a % b) : a;
      const divisor = gcd(cropWidth, cropHeight);
      let aspectRatioX = cropWidth / divisor;
      let aspectRatioY = cropHeight / divisor;
      
      // Round off the aspect ratio
      if (aspectRatioX > 20) {
        const scale = 20 / aspectRatioX;
        aspectRatioX = 20;
        aspectRatioY = Math.round(aspectRatioY * scale * 100) / 100;
      } else if (aspectRatioY > 20) {
        const scale = 20 / aspectRatioY;
        aspectRatioY = 20;
        aspectRatioX = Math.round(aspectRatioX * scale * 100) / 100;
      } else {
        aspectRatioX = Math.round(aspectRatioX * 100) / 100;
        aspectRatioY = Math.round(aspectRatioY * 100) / 100;
      }
      
      document.getElementById('current-aspect-ratio').textContent = `${aspectRatioX}:${aspectRatioY}`;
    }
  
    document.querySelectorAll('.ratio-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const ratio = this.getAttribute('data-ratio');
        cropper.setAspectRatio(eval(ratio));
      });
    });
  
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        updateOutputInfo();
      });
    });
  
    document.querySelector('.format-btn[data-format="jpeg"]').classList.add('active');
  
    pixelReductionSlider.addEventListener('input', function() {
      pixelReductionValue.textContent = `${this.value}%`;
      updateOutputInfo();
    });
  
    qualitySlider.addEventListener('input', function() {
      qualityValue.textContent = `${this.value}%`;
      updateOutputInfo();
    });
  
    saveButton.addEventListener('click', function() {
      if (!cropper) return;
      const format = document.querySelector('.format-btn.active').getAttribute('data-format');
      const quality = parseInt(qualitySlider.value) / 100;
      const pixelReduction = parseInt(pixelReductionSlider.value) / 100;
      const cropData = cropper.getData();
      const canvas = cropper.getCroppedCanvas({
        width: Math.round(cropData.width * pixelReduction),
        height: Math.round(cropData.height * pixelReduction)
      });
      
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `processed-image.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }, `image/${format}`, quality);
    });
  
    resetButton.addEventListener('click', function() {
      if (originalImage) {
        image.src = originalImage;
        initCropper();
      }
    });
  
    updateOutputInfo();
  });