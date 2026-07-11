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
    var lStr = prompt("Location (defaults to " + l + "): e(ast), w(west), b(oth)");
    switch (lStr) {
        case 'w': l = "West"; pl = "West Shelter"; break;
        case 'b': l = "All"; pl = "Both Shelters";break;
        default: break;
    }

    var S_REQ1 = document.location.protocol + "//apps.pets.maricopa.gov/adoptPets/Home/AnimalGrid?sizeFilter=1&ageFilter=1&genderFilter=1&pageNumber=";
    /* a5152151 following dogs were found together (lots)
     * a5149138 dogs found together (2)
     * a5150369 came in together (3)
     *
     S_REQ2 += "&animalId=a5149138";
     S_REQ2 += "&animalId=a5150369";
     S_REQ2 += "&animalId=a5149587";
     * */
    var S_REQ2 = "&kennelNum=&env=https%3A%2F%2Fapps.pets.maricopa.gov%2FadoptPets&fosterEligible=false" 
                    + "&animalTypeFilter=All&isLongTimer=false&isReadyToday=false&breedFilter=Any%20Breed"
                    + "&shelterFilter=" + l;
    var D_REQ = document.location.protocol + "//apps.pets.maricopa.gov/adoptPets/Home/Details/";
    var SS_REQ = document.location.protocol + "//apps.pets.maricopa.gov/SelfService/Home/AnimalInfo?AnimalId=";
    var P_REQ = document.location.protocol +
        '//apps.pets.maricopa.gov/priority/Home/AnimalGrid?' + 
        'submissionObj=%7B%22TypeChoice%22%3A%22ANY%22%2C%22SizeChoice%22%3A%22Any%20Size%22%2C%22' +
        'BreedChoice%22%3A%22Any%20Breed%22%2C%22AgeChoice%22%3A%221%22%2C%22GenderChoice%22%3A%22Any%20' +
        'Gender%22%2C%22ReasonChoice%22%3A%22Any%20Reason%22%2C%22AnimalName%22%3A%22Any%20Animal%22%2C%22' +
        'AnimalId%22%3A%22Any%20ID%22%2C%22KennelNumber%22%3A%22Any%20Kennel%22%2C%22ShelterChoice%22%3A%22' + pl + '%22%7D' + 
        '&env=https%3A%2F%2Fapps.pets.maricopa.gov%2Fpriority%2F&pageNumber=';
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
                            dogList[li++] = {"name": name, "aId": aId, "img": imgStr, "others":new Map()};
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
                            break;
                        }
                    }

                    intakeNotes:
                    for (let dc of doc.body.getElementsByClassName("card-header")) {
                        if (dc.innerText.trim().toLowerCase().startsWith("intake")) {
                            let spans = dc.parentElement.getElementsByClassName("card-body")[0].getElementsByTagName("span");
                            for (let sp of spans) {
                                /* TODO: Staff may not add accompanying text, just A#s
                                 * A5167628 A5167624 A5167623
                                 * Assuming that in the intake section, any other A# reference must be related
                                 * However, when the dog was assigned a new A#, it will show a little odd
                                 */
                                let spl = sp.innerText;
                                /*if (spl.match(/together|came in with|found with/i) != null) { */
                                    for (let np of spl.split(/\s+/)) {
                                        /* Filter away adopter numbers - ex. P{7} 
                                         * This regex will cause the leading letter (i.e. A) to be stripped
                                         */
                                        res = np.match(/(?<=[^P])([0-9]{7})/i);
                                        if (res != null) {
                                            if (!res[1].toLowerCase().startsWith("a")) {
                                                res[1] = "A" + res[1];
                                            }

                                            if (res[1].toLowerCase() != dogList[li].aId.toLowerCase()) {
                                                console.log("Adding " + res[1].toUpperCase() + " as Other dog for " + dogList[li].aId + ", li=" + li);
                                                dogList[li].others.set(res[1].toUpperCase(), null);
                                            }
                                        }
                                    }
                                /*}*/
                            }
                            break intakeNotes;
                        }
                    }

                    li++;
                    if (li < dogList.length) {
                        document.write(">");
                        dReq.open("GET", D_REQ + dogList[li].aId, true);
                        dReq.send(null);
                    } else {
                        console.log("After Adoptables");
                        console.log(dogList);
                        pageNum = 1;
                        /* Mark where priority dogs start */
                        PRI_DOG_START = li;
                        console.log("Priority index is " + PRI_DOG_START);
                        document.write("<br>Getting Priority page " + pageNum);
                        pReq.open( "GET", P_REQ + pageNum, true);
                        pReq.send(null);
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
                            saved = "";
                            if (aStatus.length > 0) {
                                saved = aStatus[0].innerText.trim();
                            }
                            dogList[li++] = {name: name, aId: aId, img: img, loc:loc, lnk:lnk, aStatus:aStatus, saved:saved, others:new Map()};
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

                    intakeNotes:
                    for (let dc of doc.body.getElementsByClassName("card-header")) {
                        if (dc.innerText.trim().toLowerCase().startsWith("intake")) {
                            let ps = dc.parentElement.getElementsByClassName("card-body")[0].getElementsByTagName("p");
                            for (let p of ps) {
                                let spl = p.innerText;
                                /*if (spl.match(/together|came in with|found with/i) != null) {*/
                                    console.log("Found intake together entry in priority");
                                    for (let np of spl.split(/\s+/)) {
                                        res = np.match(/(A?[0-9]{7})/i);

                                        if (res != null) {
                                            if (!res[1].toLowerCase().startsWith("a")) {
                                                res[1] = "A" + res[1];
                                            }

                                            if (res[1].toLowerCase() != dogList[li].aId.toLowerCase()) {
                                                console.log("Adding " + res[1].toUpperCase() + " as Other dog for Priority " + dogList[li].aId + ", li=" + li);
                                                dogList[li].others.set(res[1].toUpperCase(), null);
                                            }
                                        }
                                    }
                                /*}*/
                            }
                            break intakeNotes;
                        }
                    }


                    if (li < dogList.length - 1) {
                        li++;
                        document.write("<");
                        pdReq.open("GET", PD_REQ + dogList[li].lnk, true);
                        pdReq.send(null);
                    } else { 
                        document.write("<br>Processing gathered data");
                        console.log("Processing Others");
                        console.log("List before filter");
                        console.log(dogList);
                        console.log("List after filtering for Others > 0");
                        dogList = dogList.filter(d=>d.others.size>0);
                        /* Re-establish where the Priority dogs index is after the fitler */ 
                        for (k=0;k<dogList.length;k++) {
                            if (dogList[k].lnk != null) {
                                PRI_DOG_START = k;
                                console.log("Reset Priority dog start after filtering to be: " + PRI_DOG_START);
                                break;
                            }
                        }
                        console.log(dogList);
                        li = 0;
                        processOthers();
                    }
                }
            }
        }
    };

    oReq.onreadystatechange = function() {
        var done = 4, ok = 200;
        if (oReq.readyState == done) { 
            if (oReq.status == ok) {
                if (oReq.responseText) {
                    var doc = new DOMParser().parseFromString(oReq.responseText, "text/html"); 
                    let href = oReq.responseURL;
                    var aId = href.substring(href.lastIndexOf("/") + 1);
                    var name = "";
                    var loc = "";
                    var dataObj = {};
                    if (!doc.body.innerText.includes("no longer available")) {
                        console.log("dog available: " + aId);
                        for (let dc of doc.body.getElementsByClassName("mb-0")) {
                            if (dc.innerText.trim().toLowerCase().startsWith("name")) {
                                name = dc.getElementsByClassName("d-block")[0].innerText.trim();
                            }
                            if (dc.innerText.trim().toLowerCase().startsWith("location")) {
                                loc = dc.getElementsByClassName("d-block")[0].innerText.trim();
                            }
                        }
                        dataObj = {name:name, stat:loc, adoptable:true, lnk:null};

                    } else {
                           console.log("dog not available in Adoptables: " + aId);
                    }
                    dogList[li].others.set(aId, dataObj);
                    processOthers();
                }
            }
        }
    };

    function processOthers(doSS = false) {
        var doSend = false;
        console.log("doSS: " + doSS + ", li: " + li);
        for (let z=li; z<dogList.length; z++) {
            for ([aId,v] of dogList[z].others) {
                console.log("processOthers for " + dogList[z].aId + ": Others value=" + JSON.stringify(v));
                if ((!doSS && v == null) || (doSS && Object.keys(v).length === 0)) {
                    console.log("Getting " + (!doSS?"details":"SS") + " for Other dog: " + aId);
                    doSend = true;
                    li = z;

                    document.write(".");
                    if (!doSS) {
                        oReq.open("GET", D_REQ + aId, true);
                        oReq.send(null);
                    } else {
                        ssReq.open("GET", SS_REQ + aId, true);
                        ssReq.send(null);
                    }
                    break;
                }
            }

            if (doSend) {
                break;
            }
        }
        if (!doSend) {
            if (!doSS) {
                console.log("Processing SS for others");
                console.log(dogList);
                li = 0;
                processOthers(true);
            } else {
                console.log("Completed all processing of others");
                showResults();
            }
        }
    }

    ssReq.onreadystatechange = function() {
        var done = 4, ok = 200;
        if (ssReq.readyState == done) { 
            if (ssReq.status == ok) {
                if (ssReq.responseText) {
                    var doc = new DOMParser().parseFromString(ssReq.responseText, "text/html"); 
                    let href = ssReq.responseURL;
                    let aId = href.substring(href.lastIndexOf("=") + 1);
                    card = doc.getElementsByClassName("card")[0];
                    let name = "Not Available";
                    let status = "Not Available";
                    if (card) {
                        status = card.getElementsByTagName("span")[0].innerText.split("Status: ")[1];
                        for (let s of card.getElementsByTagName("strong")) {
                            if (s.innerText.startsWith("Animal")) {
                                aId = s.parentElement.innerText.split(": ")[1];
                            }
                            if (s.innerText.startsWith("Name")) {
                                name = s.parentElement.innerText.split(": ")[1];
                            }
                        }
                    } else {
                        console.log("Not a valid aId in SS: " + aId);
                    }

                    var dataObj = {name:name, stat:status, lnk:null};

                    /* At this point we know the Other dog is in SS but may not have been adoptable
                     * If the dog is not adoptable, check if the dog is in the Priority list
                     * We could also pre-filter by checking the SS status to see if its a non-terminal
                     * status like "Under Review"
                     */
                   console.log("Checking if Other dog " + aId + " is in Priority list (starting idx: " + PRI_DOG_START + ")");
                   console.log(dogList);
                   for (k=PRI_DOG_START;k<dogList.length;k++) {
                       if (dogList[k].aId == aId) {
                           console.log("Other dog " + dogList[k].aId + " found in Priority list for " + aId);
                           dataObj.lnk = dogList[k].lnk;
                           break;
                        }
                    }
                    dogList[li].others.set(aId, dataObj);
                    processOthers(true);
                }
            }
        }
    };

    function showResults() {
        var count = 0;
        dogList.sort(function(a,b) {return a.loc.localeCompare(b.loc, "en", {numeric: true})});
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
            if (d.lnk != null) {
               trStr = "<tr style='background-color:pink'>";
            }
            bodyStr += 
                trStr + 
                    "<td>" + d.img + "</td>" + 
                    "<td>" + d.name + "</td>" +
                    "<td>" + (d.lnk==null?D_HREF.replaceAll(AID, d.aId):P_HREF.replace(LNK,d.lnk).replace(AID,d.aId)) + "</td>" +
                    "<td style='max-width: 100px'>" + d.loc + "</td>";
             bodyStr += "<td><table border='1'>";
             d.others.forEach((v,aId) => {
                 bodyStr += "<tr><td>" + (v.adoptable?D_HREF.replaceAll(AID,aId):(v.lnk?P_HREF.replace(LNK,v.lnk).replace(AID,aId):aId)) + "</td><td>" + v.name + "</td><td>" + v.stat + "</td></tr>";
             });
             bodyStr += "</table></td>";
        });
        tableStr = "<figure>Intake Together (" + dt.toLocaleDateString() +  " " + dt.toLocaleTimeString() 
            + ")<br>Location: " + l + "<br>Number of rows: " + count + "</figure>" + bodyStr + "</table>";
        document.open();
        document.write(tableStr);
  
        var style = document.createElement("style");
        style.innerHTML= "body {font-family:Arial} " +
                            "table {border-collapse:collapse} " +
                            "td {text-align:center;padding:10px;word-wrap:break-word} b {background-color:yellow}";
        document.head.appendChild(style);
        document.close();
    }

})();

