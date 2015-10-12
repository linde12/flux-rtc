import Ractive from 'ractive';
import Template from '../templates/ChatTemplate.html';
import SimpleWebRTC from 'simplewebrtc';
import AutoLinker from 'autolinker';
import escape from 'escape-html';
import DesktopNotification from '../util/notify';

let Component = Ractive.extend({
  template: Template,
  audio: new Audio('res/audio/msg.mp3'),
  oninit () {
    let options = {
      autoRequestMedia: true,
      media: {audio: true, video:false},
      receiveMedia: {
        mandatory: {
          OfferToReceiveVideo: false
        }
      }
    };

    // Try to start with mic
    this.webRtc = new SimpleWebRTC(options);
    this.webRtc.on('readyToCall', () => {
      this.webRtc.joinRoom(this.get('hash'));
    });

    // If mic doesn't exist, start without mic
    this.webRtc.on('localMediaError', (err) => {
      console.log(err);
      if (err.name === 'DevicesNotFoundError') {
        options.autoRequestMedia = false;
        this.webRtc.joinRoom(this.get('hash'));
      }
    });
    this.initWebRtc();

    this.on({
      text (evt) {
        if (evt.original.keyCode === 13) {
          let msg = this.get('message');
          msg = escape(msg);
          msg = AutoLinker.link(msg);

          let message = {
            nick: this.get('peerId'),
            message: msg
          };
          this.push('messages', message);
          this.webRtc.sendDirectlyToAll(this.get('hash'), 'chat', message);
          this.set('message', '');
          this.nodes.chat.scrollTop = this.nodes.chat.scrollHeight;
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
      },

      nickTyped (evt) {
        if (evt.original.keyCode === 13) {
          this.webRtc.sendDirectlyToAll(this.get('hash'), 'setDisplayName',
            this.get('peerId'));
        }
      },

      mute (event, peer) {
        this.webRtc.mute(peer);
      }
    });
  },

  initWebRtc () {
    this.webRtc.on('joinedRoom', () => {
      this.set('peerId', this.webRtc.connection.getSessionid());
    });
    this.webRtc.on('channelMessage', (peer, label, data) => {
      if (data.type.indexOf('disconnect') !== -1) {
        console.log(data);
      }
      switch (data.type) {
        case 'setDisplayName':
          let peers = this.get('peers'),
            p = peers.find(function (p) { return p.id === peer.id; });
          p.nick = data.payload;
          this.set('peers', peers);
          break;
        case 'greetings':
          new DesktopNotification({
            title: 'Peer connected',
            body: 'A peer has connected to #' + this.get('hash'),
            icon: 'res/img/notification_icon.png'
          });
          let nick = this.get('peerId');

          if (nick) {
            peer.sendDirectly(this.get('hash'), 'setDisplayName', nick);
          }
          break;
        case 'chat':
          this.audio.play();
          this.push('messages', data.payload);
          this.nodes.chat.scrollTop = this.nodes.chat.scrollHeight;
          break;
      }
    });

    this.webRtc.on('peerStreamRemoved', () => {
      new DesktopNotification({
        title: 'Peer disconnected',
        body: 'A peer has disconnected from #' + this.get('hash'),
        icon: 'res/img/notification_icon.png'
      });
      this.set('peers', this.webRtc.getPeers());
    });

    this.webRtc.on('joinedRoom', () => {
      // Peers haven't been created yet... THIS UGLY
      setTimeout(() => {
        this.webRtc.sendDirectlyToAll(this.get('hash'), 'greetings', {});
      }, 1000);
    });

    this.webRtc.on('createdPeer', (peer) => {
      this.set('peers', this.webRtc.getPeers());

      peer.on('fileTransfer', (metadata, receiver) => {
        receiver.on('progress', (bytesReceived) => {
          let peers = this.get('peers'),
            p = peers.find(function (p) {
              return p.id === peer.id;
            });

          p.transferPercentage =
            Math.round((bytesReceived / metadata.size) * 100);
          p.fileData = metadata;
          this.set('peers', peers);
        });

        receiver.on('receivedFile', (file, metadata) => {
          let peers = this.get('peers'),
            p = peers.find(function (p) {
              return p.id === peer.id;
            });
          p.transferPercentage = 0;
          if (!p.files) p.files = [];
          p.files.push({
            href: URL.createObjectURL(file),
            name: metadata.name
          });
          this.set('peers', peers);
          receiver.channel.close();
        });
      });
    });
  },

  data () {
    return  {
      message: '',
      messages: [],
      peerId: '...',
      peers: [],
      files: [],
      getTimestamp () {
        let date = new Date(),
          hours = date.getHours(),
          minutes = date.getMinutes();
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return hours + ':' + minutes;
      }
    };
  }
});

export default Component;
