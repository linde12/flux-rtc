import Ractive from 'ractive';
import Template from '../templates/ChatTemplate.html';
import SimpleWebRTC from 'simplewebrtc';

let Component = Ractive.extend({
  template: Template,
  oninit () {
    this.webRtc = new SimpleWebRTC({
      autoRequestMedia: true
    });

    this.webRtc.on('readyToCall', () => {
      this.webRtc.joinRoom(this.parent.get('hash'));
    });

    this.webRtc.on('createdPeer', () => {
      this.set('peers', this.webRtc.getPeers());
    });

    this.webRtc.on('fileTransfer', (metadata, receiver) => {
      receiver.on('progress', (bytesReceived) => {
        this.set('transferPercentage',
          Math.round((bytesReceived / metadata.size) * 100));
      });

      receiver.on('receivedFile', (file, metadata) => {
        this.set('transferPercentage', 0);
        this.push('files', {
          href: URL.createObjectURL(file),
          name: metadata.name
        });
        receiver.channel.close();
      });
    });

    this.on({
      text (evt) {
        if (evt.original.keyCode === 13) {
          let message = this.get('message');
          this.push('messages', message);
          if (message === 'dc') {
            this.peer.disconnect();
          }
          this.peer.sendAll(message);
          this.set('message', '');
        }
      },

      fileSelected () {
        var file = this.nodes.fileinput.files[0],
          peer;

        peer = this.get('peers').find((peer) => {
          if (peer.id === this.nodes.selectedPeer.value) {
            return true;
          }
        });
        peer.sendFile(file);
      }
    });
  },

  data () {
    return  {
      message: '',
      messages: [],
      peers: [],
      files: [],
      transferPercentage: 0
    };
  }
});

export default Component;
