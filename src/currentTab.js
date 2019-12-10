chrome.runtime.onMessage.addListener(getMessage);

import './currentTab.css';

document.addEventListener("selectchange", function (event) {
    var bubble = document.getElementById("stackBubble");
    let sel = document.getSelection();
    if (sel.toString() === "") {
        document.body.removeChild(bubble);
    } else if (bubble != null) {
        document.body.removeChild(bubble);
    }
});

document.addEventListener("mouseup", function (event) {
    setTimeout(() => {
        console.log("Fired! B");
        var bubble = document.getElementById("stackBubble");
        let sel = document.getSelection();
        if (bubble != null) {
            if (sel.toString() === "") {
                //            document.body.removeChild(dom);
            } else {
                var bcr = sel.getRangeAt(0).getBoundingClientRect();
                var bubbleDOM = null;
                var bubbleDOM = document.createElement("div");
                bubbleDOM.setAttribute("id", "stackBubble");
                bubbleDOM.setAttribute("class", "bubble");

                bubbleDOM.style.top = bcr.top - 45 + 'px';
                bubbleDOM.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 75) + 'px';
                console.log(bcr);


                bubbleDOM.style.zIndex = 1;
                bubbleDOM.style.display = 'block';
                console.log("1");

                var ul = document.createElement("ul");
                ul.style.display = "flex";
                ul.style.flexDirection = "row";
                var li1 = document.createElement("li");
                li1.style.flex = "1";
                li1.innerHTML = "A";
                var li2 = document.createElement("li");
                li2.innerHTML = "B";
                li2.style.flex = "1";
                var li3 = document.createElement("li");
                li3.innerHTML = "C";
                li3.style.flex = "1";
                ul.appendChild(li1);
                ul.appendChild(li2);
                ul.appendChild(li3);
                bubbleDOM.appendChild(ul);


                setTimeout(() => {
                    document.body.appendChild(bubbleDOM);
                }, 50);
            }

            document.body.removeChild(bubble);
        } else {
            if (sel.toString() !== "") {
                //addDOM
                var bcr = sel.getRangeAt(0).getBoundingClientRect();
                var bubbleDOM = null;
                console.log(bcr);
                var bubbleDOM = document.createElement("div");
                bubbleDOM.setAttribute("id", "stackBubble");
                bubbleDOM.setAttribute("class", "bubble");

                //                bubbleDOM.style.width = bcr.width + 10 + "px";
                //                bubbleDOM.style.height = bcr.height + 10 + "px";

                bubbleDOM.style.top = bcr.top - 45 + 'px';
                bubbleDOM.style.left = Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 75) + 'px';

                bubbleDOM.style.zIndex = 1;
                bubbleDOM.style.display = 'block';
                console.log("2");


                var ul = document.createElement("ul");
                ul.style.display = "flex";
                ul.style.flexDirection = "row";

                var li1 = document.createElement("li");
                li1.style.flex = "1";
                li1.innerHTML = "A";

                var li2 = document.createElement("li");
                li2.innerHTML = "B";
                li2.style.flex = "1";
                var li3 = document.createElement("li");
                li3.innerHTML = "C";
                li3.style.flex = "1";
                ul.appendChild(li1);
                ul.appendChild(li2);
                ul.appendChild(li3);
                bubbleDOM.appendChild(ul);


                setTimeout(() => {
                    document.body.appendChild(bubbleDOM);
                }, 50);

            }
        }

    }, 10);
});






function getMessage(request, sender, sendResponse) {
    //    console.log(request.message);
    sendResponse({
        selection: window.getSelection().toString()
    });
}