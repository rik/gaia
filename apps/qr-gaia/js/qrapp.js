'use strict';

var QRReader = {
  pick: function qrreader_pick(e) {
    var activity = new MozActivity({
      name: 'pick',
      data: {type: 'image/jpeg'}
    });
    activity.onsuccess = (function onSuccess() {
      this.reopenSelf();
      log(activity.result.url);
      if (!activity.result.url)
        return;
      this._processing.hidden = false;
      qrcode.decode(activity.result.url);
    }).bind(this);
    activity.onerror = (function onError() {
      this.reopenSelf();
      // Don't know how the activity can fail
      log('pick failed!');
    }).bind(this);
  },

  previewOpen: function qrreader_previewOpen(e) {
    // Inverse height and width because of CSS transform 90deg
    var width = document.body.clientHeight;
    var height = document.body.clientWidth;
    this._viewfinder.style.width = width + 'px';
    this._viewfinder.style.height = height + 'px';
    this._viewfinder.style.top = ((width / 2) - (height / 2)) + 'px';
    this._viewfinder.style.left = -((width / 2) - (height / 2)) + 'px';

    this._panel.hidden = false;
    this._cameras = navigator.mozCameras.getListOfCameras();
    log(this._cameras);
    var options = {camera: this._cameras[0]};

    function gotPreviewScreen(stream) {
      log('gotPreviewScreen');
      this._previewActive = true;
      this._viewfinder.mozSrcObject = stream;
      this._viewfinder.play();
    }

    function gotCamera(camera) {
      log('gotCamera');
      this._cameraObj = camera;
      var config = {
        height: height,
        width: width
      };
      log(config.height);
      log(config.width);
      camera.getPreviewStream(config, gotPreviewScreen.bind(this));
    }
    navigator.mozCameras.getCamera(options, gotCamera.bind(this));
  },

  pictureTaken: function qrreader_pictureTaken(blob) {
    log('blob loaded');
    this._processing.hidden = false;
    var fr = new FileReader();
    fr.onload = function(frEvent) {
      log(frEvent.target.result);
      qrcode.decode(frEvent.target.result);
    };
    fr.readAsDataURL(blob);
  },

  previewDone: function qrreader_previewDone(e) {
    if (this._cameraObj) {
      this._cameraObj.takePicture({}, this.pictureTaken.bind(this));
    }
  },

  handleData: function qrreader_handleData(data) {
    log(qrcode.width + 'x' + qrcode.height);
    log('handleData ' + data);
    this._processing.hidden = true;
    if (data.startsWith('http')) {
      log('HTTP !');
      // XXX : Browser does not handle this activity properly :(
      // Should take a look at browser.js#handleActivity
      this.confirmActivity({
        name: 'view',
        data: { type: 'url', url: data }
      });
    } else if (data.startsWith('TEL:')) {
      var number = data.substr(4);
      log('TEL -> ' + number)
      new MozActivity({
        name: 'dial',
        data: {type: 'webtelephony/number', number: number}
      });
    } else if (data.startsWith('MAILTO:')) {
      new MozActivity({
        name: 'new',
        data: {type: 'mail', URI: data}
      });
    } else {
      log('unknown data');
      this.confirmUnknownData(data);
    }
    this._viewfinder.pause();
    this._viewfinder.mozSrcObject = null;
    this._panel.hidden = true;
  },

  confirmActivity: function qrreader_confirmActivity(activity) {
    var dialog = document.getElementById('confirm-url');
    var url_placeholder = document.getElementById('url-placeholder');
    url_placeholder.innerHTML = '';
    url_placeholder.appendChild(document.createTextNode(activity.data.url));
    dialog.hidden = false;
    dialog.onsubmit = function yup() {
      new MozActivity(activity);
      dialog.hidden = true;
      return false;
    };
    dialog.onreset = function cancel() {
      dialog.hidden = true;
      return false;
    };
  },

  confirmUnknownData: function qrreader_confirmUnknownData(data) {
    var dialog = document.getElementById('unknown-data');
    var data_placeholder = document.getElementById('data-placeholder');
    data_placeholder.innerHTML = '';
    data_placeholder.appendChild(document.createTextNode(data));
    dialog.hidden = false;
    dialog.onsubmit = function yup() {
      dialog.hidden = true;
      return false;
    };
  },

  // Copied from wallpaper.js because after selecting an image, we don't get the focus
  // Crashes the galery app sometimes
  // Doesn't work inside the browser
  reopenSelf: function qrreader_reopenSelf() {
    navigator.mozApps.getSelf().onsuccess = function getSelfCB(evt) {
      var app = this.result;
      if (app) {
        app.launch();
      }
    };
  },

  initCamera: function qrreader_initCamera() {
    var preview_open = document.getElementById('preview-open');
    preview_open.hidden = false;
    preview_open.addEventListener('click', this.previewOpen.bind(this));

    var preview_done = document.getElementById('preview-done');
    preview_done.addEventListener('click', this.previewDone.bind(this));

    this._panel = document.getElementById('preview-panel');
    this._viewfinder = document.getElementById('viewfinder');
  },

  init: function qrreader_init() {
    var picker = document.getElementById('picker');
    picker.addEventListener('click', this.pick.bind(this));

    this._processing = document.getElementById('processing');

    qrcode.callback = this.handleData.bind(this);

    if (navigator.mozCameras) {
      this.initCamera();
    }
  }
};

window.addEventListener('load', function qrLoad(evt) {
  QRReader.init();
});
