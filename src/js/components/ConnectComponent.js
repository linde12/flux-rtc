import Ractive from 'ractive';
import Template from '../templates/ConnectTemplate.html';

let Component = Ractive.extend({
  template: Template,
  oninit: function () {
    this.on({
      connect: function () {
        window.location.href = '#' + this.get('peerId');
        window.location.reload();
      }
    });
  },
  data: function () {
    return {
      peerId: ''
    };
  }
});

export default Component;
