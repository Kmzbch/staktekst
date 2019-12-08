document.addEventListener("selectionchange", function (event) {
    const str = window.getSelection().toString();
    console.log(str + "!!!");
});