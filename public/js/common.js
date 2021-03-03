$("#postTextarea, #replyTextarea").keyup(event => {
    var textbox = $(event.target);
    var value = textbox.val().trim();

    var isModal = textbox.parents(".modal").length === 1;

    var submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton")

    if(submitButton.length === 0) return alert("No submit button found");

    if(value === "") {
        submitButton.prop("disabled", true);
        return;
    }

    submitButton.prop("disabled", false);
});

$("#submitPostButton").click(event => {
    var button = $(event.target);
    var textbox = $("#postTextarea");

    var data = {
        content: textbox.val(),
        deviceOS: getOS()
    }

    $.post("/api/posts", data, (postData, status, xhr) => {
        var html = createPostHtml(postData)
        $(".postsContainer").prepend(html);
        textbox.val("");
        button.prop("disabled", true);
    })
});

$("#submitReplyButton").click(event => {
    var button = $(event.target);
    var textbox = $("#replyTextarea");

    const id = button.data().id;

    var data = {
        content: textbox.val(),
        replyTo: id,
        deviceOS: getOS()
    }

    $.post("/api/posts/reply", data, (postData) => {
       location.reload();
    })
});

$(document).on("click", ".likeButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) => {
            button.find("span").text(postData.likes.length || "");
            if (postData.likes.includes(userLoggedIn._id)) {
                button.addClass("active");
            } else {
                button.removeClass("active");
            }
        }
    })
});

$(document).on("click", ".retweetButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST",
        success: (postData) => {
           
            button.find("span").text(postData.post.retweetUsers.length || "");
            if (postData.post.retweetUsers.includes(userLoggedIn._id)) {
                button.addClass("active");
            } else {
                button.removeClass("active");
            }

            var html = createPostHtml(postData.newPosts)
            $(".postsContainer").prepend(html);
        }
    })
});

$(document).on("click", ".post", (event) => {
    var element = $(event.target);
    var postId = getPostIdFromElement(element);
    
    if(postId !== undefined && !element.is('button')) {
        window.location.href = '/post/' + postId;
    }
});

$("#replyModal").on("show.bs.modal", (event) => {
    var button = $(event.relatedTarget);
    const postId = getPostIdFromElement(button);
    $("#submitReplyButton").attr("data-id", postId)
    $.get("/api/posts/" + postId, results => {
        outputPosts(results.postData, $("#originalPostContainer"))
    })
});

$("#replyModal").on("hidden.bs.modal", (event) => {
    $("#originalPostContainer").html("");
});

function getPostIdFromElement(element) {
    var isRoot = element.hasClass("post");
    var rootElement = isRoot ? element : element.closest(".post");
    var postId = rootElement.data().id;
    return postId
}

function createPostHtml(postData, largeFont = false) {

    var mainPost = postData.metadata !== undefined
    var isRetweet = postData.retweetData !== undefined;
    var retweetedBy = isRetweet ? postData.postedBy.username : null;

    postData = isRetweet ? postData.retweetData: postData;

    var postedBy = postData.postedBy

    if(postedBy._id === undefined) {
        return console.log("User Object not populated")
    }

    var displayName = postedBy.firstName + " " + postedBy.lastName;

   var timestamp = timeSince(new Date(postData.createdAt).getTime());

    var likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : "";
    var retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" : ""
    var largeFontClass = largeFont ? "largeFont" : "";

    var retweetText = '';

    if(isRetweet) {
        retweetText = `<span>
                            <i class="fas fa-retweet"></i>
                            Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>
                        </span>
                        `
    }

    var replyFlag = '';

    if(postData.replyTo && postData.replyTo._id) {
        if(!postData.replyTo._id) {
            return alert("REply is not populated")
        }
        else if(!postData.replyTo.postedBy._id) {
            return alert("REply is not populated")
        }
        var replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `<div class='replyFlag'>
                        Replying to <a href="/profile/${replyToUsername}">@${replyToUsername}</a>
                    </div>
                    `
    }

    var metadata = "";
    if(largeFont) {
        metadata = `
        <div class='metadata'>
        ${moment(new Date(postData.createdAt)).format("LT")} - ${moment(new Date(postData.createdAt)).format("l")} - <span id="meta">Twitter for ${postData.deviceOS}</span>
        </div>
         `
    }

    return `
            <div data-id='${postData._id}' class="post ${largeFontClass}">
                <div class="postActionContainer">
                    ${retweetText}
                </div>
                <div class="mainContentContainer">
                    <div class="userImageContainer">
                        <img src="${postedBy.profilePic}" alt="">
                    </div>
                    <div class="postContentContainer">
                        <div class="header">
                            <a class="displayName" href="/profile/${postedBy.username}">${displayName}</a>
                            <span class="username">@${postedBy.username}</span>
                            <span class="date">${timestamp}</span>
                        </div>
                        ${replyFlag}
                        <div class="postBody">
                            <span>${postData.content}</span>
                        </div>
                        <div class="postFooter">
                            <div class="postButtonContainer">
                                <button data-toggle="modal" data-target="#replyModal">
                                    <i class="far fa-comment"></i> 
                                </button>
                            </div>
                            <div class="postButtonContainer green">
                                <button class='retweetButton ${retweetButtonActiveClass}'>
                                    <i class="fas fa-retweet"></i>
                                    <span>${postData.retweetUsers.length || ""}</span>
                                </button>
                            </div>
                            <div class="postButtonContainer red">
                                <button class='likeButton ${likeButtonActiveClass}'>
                                    <i class="far fa-heart"></i>
                                    <span>${postData.likes.length || ""}</span>
                                </button>
                            </div>
                        </div>
                        ${metadata}
                    </div>
                </div>
            </div>
    `;
}

function outputPosts(results, container) {
    container.html("");

    if(!Array.isArray(results)) {
        results = [results]
    }

    results.forEach(result => {
        var html = createPostHtml(result);
        container.append(html);
    });

    if(results.length === 0) {
        container.append("<span class='noResults'>Nothing to Show</span>")
    }
}

function outputPostsWithReplies(results, container) {
    results.postData.metadata = true
    container.html("");

    if (results.replyTo !== undefined && results.replyTo._id !==undefined) {
        var html = createPostHtml(results.replyTo);
        container.append(html);
    }

    var mainPostHtml = createPostHtml(results.postData, true);
    container.append(mainPostHtml);

    results.replies.forEach(result => {
        var html = createPostHtml(result);
        container.append(html);
    });
}

function timeSince(timeStamps) {
    var timeStamp = new Date(timeStamps)
  var now = new Date(),
    secondsPast = (now.getTime() - timeStamps) / 1000;
  if (secondsPast < 60) {
    if (secondsPast < 30)  return 'Just now';   
    return parseInt(secondsPast) + 's';
  }
  if (secondsPast < 3600) {
    return parseInt(secondsPast / 60) + 'm';
  }
  if (secondsPast <= 86400) {
    return parseInt(secondsPast / 3600) + 'h';
  }
  if (secondsPast > 86400) {
    day = timeStamp.getDate();
    month = timeStamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ", "");
    year = timeStamp.getFullYear() == now.getFullYear() ? "" : " " + timeStamp.getFullYear();
    return day + " " + month + year;
  }
}

function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;
  
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iPhone';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }
  
    return os;
}

  

