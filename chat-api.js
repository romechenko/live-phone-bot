(function () {
  let textArea = document.getElementsByTagName('textarea')[0];
  let button = textArea.nextSibling;
  const sectionClassName = 'w-full border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group bg-gray-50 dark:bg-[#444654]';
  const subSectionClassName = 'markdown prose w-full break-words dark:prose-invert light';
  const timeLimit = 3000;
  const chatWebSocket = new WebSocket('ws://localhost:8080/chat');
  window['chatWebSocket'] = chatWebSocket;
  chatWebSocket.onmessage = (message) => {
    const data = JSON.parse(message.data);
    switch (data.type) {
      case 'console':
        console.log(data.message);
        break;
      case 'sendChat':
        api.send(data.message);
        break;
      default:
        console.log('Unknown message type:', data.type);
        break;
    }
  };

  let api = {
    init: function () {
    },
    send: function (message) {
      textArea.value = message;
      setTimeout(() => button.click(), 0);
      chatWebSocket.send(JSON.stringify({ type: 'chatSent', message: message }));
      setTimeout(logLastSectionContent, 100);
    }
  };
  window['api'] = api;
  api.init();
  console.log('API initialized');

  let logLastSectionContent = () => {
    let sections = document.getElementsByClassName(sectionClassName);
    let divElement = sections[sections.length - 1].getElementsByClassName(subSectionClassName)[0];
    let t = divElement.textContent;
    let timeCounter = 0;
    let compare = () => {
      setTimeout(() => {
        if (divElement.textContent.length <= 1) {
          // wait some more, it hasent started loading yet
          compare();
        } else if (t.length != divElement.textContent.length) {
          timeCounter = 0;
          t = divElement.textContent;
          // console.log('New paragraph content:', divElement.textContent);
          chatWebSocket.send(JSON.stringify({ type: 'botResponse', message: divElement.textContent }));
          // wait some more, it hasent finished loading yet
          compare();
        } else if (timeCounter > timeLimit) {
          console.log('paragraph content loaded');
        } else {
          timeCounter += 200;
          compare();
        }
      }, 200);
    };
    compare();
  };
  return false;
})();
