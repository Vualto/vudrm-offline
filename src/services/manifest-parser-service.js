const xml = require('xmldoc');
const mainProcess = require('../main');

exports.parse = async (manifestURL, manifest) => {
    const doc = new xml.XmlDocument(manifest);
    const periods = doc.childrenNamed('Period');
    periods.forEach(adaptationSetParser(manifestURL));
}

let adaptationSetParser = (manifestURL) => (period) => {
    const adaptationSets = period.childrenNamed('AdaptationSet');
    adaptationSets.forEach(representationParser(manifestURL));
}

let representationParser = (manifestURL) => (set) => {
    if (set.attr.contentType !== "video" && set.attr.contentType !== "audio") return;
    const representations = set.childrenNamed('Representation');

    representations.forEach(segmentTemplateParse(manifestURL));
}

let segmentTemplateParse = (manifestURL) => (rep) => {
    const segments = rep.childrenNamed('SegmentTemplate');
    segments.forEach(segmentTimelineParser(rep.attr.id, manifestURL));
}

let segmentTimelineParser = (repId, manifestURL) => (segment) => {
    const fragmentTimes = parseSegmentTimeline(segment.childNamed('SegmentTimeline'));
    const fragmentUrls = fragmentTimes.map(mapFragmentURL(segment.attr.media, repId, manifestURL));

    mainProcess.queueDownload(fragmentUrls);
}

let mapFragmentURL = (mediaPattern, repId, manifestURL) => (fragment) => {
    let modifiedMedia = mediaPattern.replace("$RepresentationID$", repId);
    modifiedMedia = typeof fragment.actualStart === 'undefined' || fragment.actualStart === null
        ? modifiedMedia.replace('-$Time$', '')
        : modifiedMedia.replace('$Time$', fragment.actualStart.toString());

    return `${getBaseUrl(manifestURL)}${modifiedMedia}`
}

let parseSegmentTimeline = (timeline) => {
    let times = timeline.childrenNamed('S');
    let mappedTimes = times.map(mapFragment);
    return mappedTimes.reduce(segmentTimeReducer, []);
}
let segmentTimeReducer = (prev, curr, index, currArray) => {
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
};
let mapFragment = (obj) => {
    return {
        start: typeof obj.attr.t !== 'undefined' ? Number(obj.attr.t) : undefined,
        duration: Number(obj.attr.d),
        repeat: typeof obj.attr.r !== 'undefined' ? Number(obj.attr.r) : undefined
    };
}

let getBaseUrl = (manifestURL) => {
    let slashIndex = manifestURL.lastIndexOf('/');
    let s = manifestURL.substr(0, slashIndex);
    return s.replace('.ism', '.ism/dash/');
}