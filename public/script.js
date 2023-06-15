const form = document.getElementById('uploadForm');
    const videoFileInput = document.getElementById('videoFile');
    const videoSection = document.getElementById('videoSection');
    const convertedVideo = document.getElementById('convertedVideo');
    const convertedVideoSource = document.getElementById('convertedVideoSource');
    const downloadLink = document.getElementById('downloadLink');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const maintainAspectRatioCheckbox = document.getElementById('maintainAspectRatio');

    // Function to update width and height based on video file selection
    function updateDimensions(file) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        const { videoWidth, videoHeight } = video;
        widthInput.value = videoWidth;
        heightInput.value = videoHeight;
        widthInput.disabled = true;
        heightInput.disabled = true;
        maintainAspectRatioCheckbox.disabled = true;
      };
      video.src = URL.createObjectURL(file);
    }

    // Function to calculate the new width and height maintaining aspect ratio
    function calculateNewDimensions(originalWidth, originalHeight) {
      const newWidth = parseInt(widthInput.value);
      const aspectRatio = originalWidth / originalHeight;
      const newHeight = Math.round(newWidth / aspectRatio);
      heightInput.value = newHeight;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const request = new XMLHttpRequest();

      request.open('POST', '/upload');
      request.onload = () => {
        if (request.status === 200) {
          const { convertedFile, originalWidth, originalHeight } = JSON.parse(request.responseText);

          videoSection.style.display = 'block';
          convertedVideoSource.src = convertedFile;
          convertedVideo.load();

          downloadLink.href = convertedFile;

          // Set the original width and height values
          widthInput.value = originalWidth;
          heightInput.value = originalHeight;

          // Calculate and update new dimensions if maintainAspectRatio is checked
          if (maintainAspectRatioCheckbox.checked) {
            calculateNewDimensions(originalWidth, originalHeight);
          }

          // Enable/disable width and height inputs based on maintainAspectRatio checkbox
          maintainAspectRatioCheckbox.addEventListener('change', () => {
            widthInput.disabled = true;
            heightInput.disabled = true;

            if (maintainAspectRatioCheckbox.checked) {
              // Calculate and update new dimensions
              calculateNewDimensions(originalWidth, originalHeight);
            }
          });
        }
      };
      request.onerror = () => {
        console.error('Error occurred during file upload.');
      };

      request.send(formData);
    });

    function handleFileSelection(event) {
      const file = event.target.files[0];
      updateDimensions(file);
    }

    widthInput.addEventListener('input', () => {
      const originalWidth = parseInt(widthInput.value);
      const originalHeight = parseInt(heightInput.value);
      if (maintainAspectRatioCheckbox.checked) {
        calculateNewDimensions(originalWidth, originalHeight);
      }
    });

    videoFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      updateDimensions(file);
    });
