javascript:(function(){

    var req = new XMLHttpRequest();
    var dReq = new XMLHttpRequest();
    var oReq = new XMLHttpRequest();
    var ssReq = new XMLHttpRequest();
    var pReq = new XMLHttpRequest();
    var pdReq = new XMLHttpRequest();
    var dogList = [];
    var li = 0;
    var PRI_DOG_START = 0;
    var pageNum = 0;
    var ENTRIES_PER_PAGE = 21;
    var totalCount = 0;

    if (document.location.host != "apps.pets.maricopa.gov") {
        window.open('http://apps.pets.maricopa.gov/adoptPets/Home', '_blank');
    }

    var l = "East";
    var pl = "East Shelter";
    var lStr = prompt("Location (defaults to " + l + "): e(ast), w(west), p(etsmart), a(ll)");
    switch (lStr) {
        case 'w': l = "West"; pl = "West Shelter"; break;
        case 'p': l = "Petsmart"; pl = ""; break;
        case 'a': l = "All"; pl = "Both Shelters";break;
        default: break;
    }

    var S_REQ1 = document.location.protocol + "//apps.pets.maricopa.gov/adoptPets/Home/AnimalGrid?sizeFilter=1&ageFilter=1&genderFilter=1&pageNumber=";
    var S_REQ2 = "&kennelNum=&env=https%3A%2F%2Fapps.pets.maricopa.gov%2FadoptPets&fosterEligible=false" 
                    + "&animalTypeFilter=All&isLongTimer=false&isReadyToday=false&breedFilter=Any%20Breed"
                    + "&shelterFilter=" + l;
    var D_REQ = document.location.protocol + "//apps.pets.maricopa.gov/adoptPets/Home/Details/";
    var SS_REQ = document.location.protocol + "//apps.pets.maricopa.gov/SelfService/Home/AnimalInfo?AnimalId=";
    var P_REQ = document.location.protocol +
        '//apps.pets.maricopa.gov/priority/Home/AnimalGrid?' + 
        'submissionObj=%7B%22TypeChoice%22%3A%22ANY%22%2C%22SizeChoice%22%3A%22Any%20Size%22%2C%22BreedChoice%22%3A%22Any%20Breed%22%2C%22AgeChoice%22%3A%221%22%2C' +
        '%22GenderChoice%22%3A%22Any%20Gender%22%2C%22ReasonChoice%22%3A%22Any%20Reason%22%2C%22AnimalName%22%3A%22Any%20Animal%22%2C%22AnimalId%22%3A%22Any%20ID%22%2C' +
        '%22KennelNumber%22%3A%22Any%20Kennel%22%2C%22ShelterChoice%22%3A%22' + pl + '%22%7D&env=https%3A%2F%2Fapps.pets.maricopa.gov%2Fpriority%2F&pageNumber=';
 
    var PD_REQ = document.location.protocol + "//apps.pets.maricopa.gov";
    
    document.open();
    document.write("Getting dogs from " + l + " ...");
    req.open( "GET", S_REQ1 + pageNum + S_REQ2, true);
    req.send(null);

    req.onreadystatechange = function() {
        var done = 4, ok = 200;
        if (req.readyState == done) {
            if (req.status == ok) {
                if (req.responseText) {
                    var doc = new DOMParser().parseFromString(req.responseText, "text/html"); 
                    [].forEach.call(
                        doc.getElementsByClassName("dogCard"), function (dc) {
                            aId = dc.getElementsByTagName("a")[0].getAttribute("onClick").split("'")[1];
                            name = dc.querySelector(".searchPetTitleSpan").textContent.trim().toUpperCase();
                            imgStr = dc.getElementsByTagName("img")[0].outerHTML;
                            imgStr = imgStr.slice(0,4) + " style='max-width:200px'" + imgStr.slice(4);
                            dogList[li++] = {priority:false, name:name, aId:aId, img:imgStr, intakeDate:"",intakeLen:"", rtnRes:""};
                       }
                    );

                    totalCount = doc.getElementsByClassName("searchCountLabel")[0].innerText.trim().split(" ")[0];
                    if (Math.floor(totalCount/ENTRIES_PER_PAGE) > pageNum) {
                        pageNum++;
                        req.open("GET", S_REQ1 + pageNum + S_REQ2, true);
                        req.send(null);
                    } else { 
                        document.write("<br>Getting details for each dog ...");
                        li = 0;
                        dReq.open("GET", D_REQ + dogList[li].aId, true);
                        dReq.send(null);
                    }
                }
            }
        }
    };

    dReq.onreadystatechange = function() {
        var done = 4, ok = 200;
        if (dReq.readyState == done) { 
            if (dReq.status == ok) {
                if (dReq.responseText) {
                    var doc = new DOMParser().parseFromString(dReq.responseText, "text/html"); 
                    var loc = "";

                    for (let dc of doc.body.getElementsByClassName("mb-0")) {
                        if (dc.innerText.trim().toLowerCase().startsWith("location")) {
                            dogList[li].loc = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                        if (dc.innerText.trim().toLowerCase().startsWith("arrived")) {
                            dogList[li].intakeDate = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                    }

                    intakeNoteSearch:
                    for (let dc of doc.body.getElementsByClassName("card-header")) {
                        if (dc.innerText.trim().toLowerCase().startsWith("intake")) {
                            let spans = dc.parentElement.getElementsByClassName("card-body")[0].getElementsByTagName("span");
                            let intakeLen = "";
                            let rtnRes = "";
                            for (let sp of spans) {
                                let spl = sp.innerText;
                                /* this delimiter is not perfect - if staff mistyped or altered, it throws everything off
                                 */
                                let resps = spl.split("--");
                                for (r=0; r<resps.length; r++) {
                                    if ((resps[r].match(/how long have you had the animal/i) != null) || 
                                        (resps[r].match(/how long have you had your pet/i) != null)) {
                                        intakeLen = resps[r+1].trim();
                                    }

                                    if (resps[r].match(/what is the reason for surrender/i) != null) {
                                        rtnRes = resps[r+1].trim();
                                    }
                                }

                                if (intakeLen != "" || rtnRes != "") {
                                    console.log(dogList[li].aId + "- Length held: " + intakeLen);
                                    console.log(dogList[li].aId + "- Return reason: " + rtnRes);
                                    dogList[li].intakeLen = intakeLen;
                                    dogList[li].rtnRes = rtnRes;
                                    break intakeNoteSearch;
                                }
                            }
                        }
                    }

                    li++;
                    if (li < dogList.length) {
                        document.write(">");
                        dReq.open("GET", D_REQ + dogList[li].aId, true);
                        dReq.send(null);
                    } else {
                        if (pl != "") {
                            console.log("After Adoptables");
                            console.log(dogList);
                            pageNum = 1;
                            /* Mark where priority dogs start */
                            PRI_DOG_START = li;
                            console.log("Priority index is " + PRI_DOG_START);
                            document.write("<br>Getting Priority page " + pageNum);
                            pReq.open( "GET", P_REQ + pageNum, true);
                            pReq.send(null);
                        } else {
                            showResults();
                        }
                    }
                }
            }
        }
    };

    pReq.onreadystatechange = function() {
        var done = 4, ok = 200;
        if (pReq.readyState == done) {
            if (pReq.status == ok) {
                if (pReq.responseText) {
                    var doc = new DOMParser().parseFromString(pReq.responseText, "text/html"); 
                    [].forEach.call(
                        doc.getElementsByClassName("dogCard"), function (dc) {
                            anchs = dc.getElementsByTagName("a");
                            lnk = anchs[0].getAttribute("href");
                            titleSpans = anchs[0].getElementsByTagName("span");
                            aId = titleSpans[0].innerText.trim();
                            name = titleSpans[1].innerText.trim(); 
                            detailSpans = dc.getElementsByClassName("searchPetInfoAgeSex");
                            loc = detailSpans[2].innerText.trim();
                            imgG = dc.getElementsByClassName("img-gradient")[0];
                            img = imgG.outerHTML.replace(/<img /,"<img style='max-width:200px' ");
                            aStatus = imgG.getElementsByTagName("p");
                            /* Don't include dogs that are on the priority list but were already saved */ 
                            if (aStatus.length == 0) {
                                dogList[li++] = {priority:true, name: name, aId: aId, img: img, loc:loc, lnk:lnk, aStatus:aStatus, intakeDate:"", rtnRes:"", intakeLen:""};
                            }
                       }
                    );
                   
                    nextBtn = false;
                    navBtns = doc.querySelectorAll("button.btn-secondary");
                    for (let b=0;b<navBtns.length;b++) {
                        if (navBtns[b].innerText.toLowerCase().trim() == "next") {
                            nextBtn = true;
                            break;
                        }
                    }

                    if (nextBtn) {
                        pageNum++;
                        document.write("<br>Getting Priority page " + pageNum);
                        pReq.open("GET", P_REQ + pageNum, true);
                        pReq.send(null);
                    } else { 
                        document.write("<br>Getting Priority dog details...");
                        console.log("Getting priority details");
                        console.log(dogList);
                        li = PRI_DOG_START;
                        pdReq.open("GET", PD_REQ + dogList[li].lnk, true);
                        pdReq.send(null);
                    }
                }
            }
        }
    };

    pdReq.onreadystatechange = function() {
        var done = 4, ok = 200;
        if (pdReq.readyState == done) { 
            if (pdReq.status == ok) {
                if (pdReq.responseText) {
                    var doc = new DOMParser().parseFromString(pdReq.responseText, "text/html"); 

                    /* This check should not be needed but I have seen a case where the priority link pointed
                     * to a page with no information on it - this breaks the flow so adding this check
                     * to ensure all the dogs can appear
                     */
                    modals = doc.getElementsByClassName("petInfoModal");
                    if (modals.length == 0) {
                        dogList[li].intakeLen = "Information not available";
                        dogList[li].rtnRes = "Information not available";
                    } else {
                        for (let dd of modals[0].getElementsByClassName("mb-0")) {
                            if (dd.innerText.trim().toLowerCase().startsWith("intake date")) {
                                dogList[li].intakeDate = dd.getElementsByTagName("span")[0].innerText.trim();
                                break;
                            }
                        }
                        
                        intakeNotes:
                        for (let dc of doc.body.getElementsByClassName("card-header")) {
                            if (dc.innerText.trim().toLowerCase().startsWith("intake")) {
                                let dts = dc.parentElement.getElementsByClassName("card-body")[0].getElementsByTagName("dt");
                                let dds = dc.parentElement.getElementsByClassName("card-body")[0].getElementsByTagName("dd");
                                let rtnRes = "";
                                let intakeLen = "";
                                for (dt=0; dt<dts.length; dt++) {
                                    if ((dts[dt].innerText.match(/how long have you had the animal/i) != null) ||
                                        (dts[dt].innerText.match(/how long have you had your pet/i) != null)) {
                                        intakeLen = dds[dt].innerText.trim();
                                    }
    
                                    if (dts[dt].innerText.match(/what is the reason for surrender/i) != null) {
                                        rtnRes = dds[dt].innerText.trim();
                                    }
                                }
    
                                if (intakeLen != "" || rtnRes != "") {
                                    console.log(dogList[li].aId + "- Length held: " + intakeLen);
                                    console.log(dogList[li].aId + "- Return reason: " + rtnRes);
                                    dogList[li].intakeLen = intakeLen;
                                    dogList[li].rtnRes = rtnRes;
                                    break intakeNotes;
                                }
                            }
                        }
                    }

                    if (li < dogList.length - 1) {
                        li++;
                        document.write("<");
                        pdReq.open("GET", PD_REQ + dogList[li].lnk, true);
                        pdReq.send(null);
                    } else { 
                        showResults();
                    }
                }
            }
        }
    };

    function showResults() {
        var count = 0;
        dogList.sort(function(a,b) {return b.intakeDate.localeCompare(a.intakeDate, "en", {numeric: true})});
        console.log("showResults");
        console.log(dogList);

        var bodyStr = "<table border='1''>";
        dt = new Date();
        const AID = "{}";
        const LNK = "{}";
        const D_HREF= "<a href='https://apps.pets.maricopa.gov/adoptPets/Home/Details/" + AID + "' target='_blank'>" + AID + "</a>";
        const P_HREF= "<a href='https://apps.pets.maricopa.gov" + LNK + "' target='_blank'>" + AID + "</a>";
        dogList.forEach(d => {
            count++;
            smName =  d.name.replace(" ","-").replace("'","");
            let trStr = "<tr>";
            if (d.priority) {
               trStr = "<tr style='background-color:pink'>";
            }
            bodyStr += 
                trStr + 
                    "<td>" + d.img + "</td>" + 
                    "<td>" + d.name + "<br><br>" +
                        (d.lnk==null?D_HREF.replaceAll(AID, d.aId):P_HREF.replace(LNK,d.lnk).replace(AID,d.aId)) + "</td>" +
                    "<td style='max-width: 100px'>" + d.loc + "</td>" +
                    "<td>Intake Date:<br>" + d.intakeDate + "</td>" +
                    "<td class='desc'>Length Held:<br>" + d.intakeLen + "</td>" +
                    "<td class='reason'>Return Reason:<br>" + d.rtnRes + "</td>" +
                    "</tr>";
        });
        tableStr = "<figure>Dogs By Intake Date (" + dt.toLocaleDateString() +  " " + dt.toLocaleTimeString() 
            + ")<br>Location: " + l + "<br>Number of rows: " + count + "</figure></table>" + bodyStr + "</table>";
        document.open();
        document.write(tableStr);
  
        var style = document.createElement("style");
        style.innerHTML= "body {font-family:Arial} " +
                            "table {border-collapse:collapse} " +
                            ".desc {text-align:left;max-width:200px} " +
                            ".reason {text-align:left;max-width:350px} " +
                            "td {text-align:center;padding:10px;word-wrap:break-word} b {background-color:yellow}";
        document.head.appendChild(style);
        document.close();
    }

})();

