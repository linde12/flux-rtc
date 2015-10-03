import Ractive from 'ractive';
import Template from '../templates/ChatTemplate.html';
import SimpleWebRTC from 'simplewebrtc';
import DesktopNotification from '../util/notify';

let Component = Ractive.extend({
  template: Template,
  oninit () {
    this.webRtc = new SimpleWebRTC({
      autoRequestMedia: true,
      receiveMedia: {
        mandatory: {
          OfferToReceiveVideo: false
        }
      }
    });

    this.webRtc.on('readyToCall', () => {
      this.webRtc.joinRoom(this.parent.get('hash'));
    });

    this.webRtc.on('createdPeer', (peer) => {
      new DesktopNotification({
        title: 'Peer connected',
        body: 'A peer has connected to #' + this.get('hash')
      });
      this.set('peers', this.webRtc.getPeers());

      peer.on('fileTransfer', (metadata, receiver) => {
        receiver.on('progress', (bytesReceived) => {
          let peers = this.get('peers'),
            p = peers.find(function (p) {
              return p.id === peer.id;
            });
          p.transferPercentage =
            Math.round((bytesReceived / metadata.size) * 100);
          this.set('peers', peers);
        });

        receiver.on('receivedFile', (file, metadata) => {
          let peers = this.get('peers'),
            p = peers.find(function (p) {
              return p.id === peer.id;
            });
          p.transferPercentage = 0;
          this.set('peers', peers);

          this.push('files', {
            href: URL.createObjectURL(file),
            name: metadata.name
          });
          receiver.channel.close();
        });
      });
    });

    /*this.webRtc.on('fileTransfer', (metadata, receiver) => {
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
    });*/

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

      fileSelected (evt, id) {
        var file = evt.node.files[0],
          peer;

        peer = this.get('peers').find((peer) => {
          if (peer.id === id) {
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
      files: []
    };
  }
});

export default Component;
