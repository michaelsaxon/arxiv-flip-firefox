let gettingAllCommands = browser.commands.getAll();
gettingAllCommands.then((commands) => {
  for (let command of commands) {
    console.log(command);
  }
});

browser.commands.onCommand.addListener((command) => {
  current = browser.tabs.query({active: true, currentWindow: true})
  console.log(current)
  function onGot(tabInfo) {
    console.log(tabInfo);
    url = tabInfo[0].url
    id = tabInfo[0].id
   if (url.includes("arxiv.org")) {
        newurl = url
    if (url.includes("/abs/")) {
        newurl = newurl.replace("/abs/", "/pdf/").concat(".pdf")
    } else if (url.includes("/pdf/") && url.includes(".pdf")) {
        newurl = newurl.replace("/pdf/", "/abs/").replace(".pdf", "")
    }
    browser.tabs.update(id, {url : newurl})
  }
  }
  function onError(error) {
      console.log(`Error: ${error}`);
}
    current.then(onGot, onError)
});