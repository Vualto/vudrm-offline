const xml = require('xmldoc');
const { remote, } = require('electron');
const mainProcess = require('../main');

let REP_ID, BASE_URL, MEDIA_PATTERN;

module.exports.parse = async (manifestURL, manifest) => {
    const doc = new xml.XmlDocument(manifest);
    const periods = doc.childrenNamed('Period');
    periods.forEach(period => {
        const adaptationSets = period.childrenNamed('AdaptationSet');
        adaptationSets.forEach(set => {
            if (set.attr.contentType !== "video" && set.attr.contentType !== "audio") return;
            const representations = set.childrenNamed('Representation');

            representations.forEach(rep => {
                REP_ID = rep.attr.id;
                const segments = rep.childrenNamed('SegmentTemplate');
                segments.forEach(segment => {
                    MEDIA_PATTERN = segment.attr.media;
                    BASE_URL = getBaseUrl(manifestURL, MEDIA_PATTERN);
                    const fragmentTimes = parseSegmentTimeline(segment.childNamed('SegmentTimeline'));
                    const fragmentUrls = fragmentTimes.map(mapFragmentURL);
                    mainProcess.queueDownload(fragmentUrls);
                });
            });
        });
    });

}

let mapFragmentURL = (fragment) => {
    let modifiedMedia = MEDIA_PATTERN.replace("$RepresentationID$", REP_ID);
    modifiedMedia = typeof fragment.actualStart === 'undefined' || fragment.actualStart === null
        ? modifiedMedia.replace('-$Time$', '')
        : modifiedMedia.replace('$Time$', fragment.actualStart.toString());

    return `${BASE_URL}${modifiedMedia}`
}

let parseSegmentTimeline = (timeline) => {
    let times = timeline.childrenNamed('S');
    let mappedTimes = times.map(mapFragment)
    return mappedTimes.reduce((prev, curr, index, currArray) => {
        if (index === currArray.length - 1) return prev;
        let actualDuration = prev.length !== 0 ? prev[prev.length - 1].actualStart : 0;
        if (curr.start === 0) {
            prev.push({});
            prev.push({ actualStart: curr.start });
            actualDuration = actualDuration + curr.duration;
            prev.push({ actualStart: curr.duration });
        } else {
            actualDuration = actualDuration + curr.duration;
            prev.push({ actualStart: actualDuration });
        }
        if (curr.repeat) {
            for (let i = 0; i < curr.repeat; i++) {
                actualDuration = actualDuration + curr.duration;
                prev.push({ actualStart: actualDuration });
            }
        }
        return prev;
    }, []);
}

let mapFragment = (obj) => {
    return {
        start: typeof obj.attr.t !== 'undefined' ? Number(obj.attr.t) : undefined,
        duration: Number(obj.attr.d),
        repeat: typeof obj.attr.r !== 'undefined' ? Number(obj.attr.r) : undefined
    };
}

let getBaseUrl = (fullUrl, media) => {
    let slashIndex = fullUrl.lastIndexOf('/');
    let s = fullUrl.substr(0, slashIndex);
    return s.replace('.ism', '.ism/dash/');
}