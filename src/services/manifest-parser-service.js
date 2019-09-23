const xml = require('xmldoc');
const mainProcess = require('../main');
const path = require('path');
class ManifestParser {
    constructor(manifestURL, dir, manifest) {
        this._manifestURL = manifestURL;
        this._directory = dir;
        this._representationId = '';
        this._media = '';
        this._manifestData = new xml.XmlDocument(manifest);
        this._languages;
    }

    async parse() {
        this.parseDoc();
    }

    parseDoc() {
        let periods = this._manifestData.childrenNamed('Period');
        periods.forEach(period => { this.parsePeriods(period); })
    }

    parsePeriods(period) {
        let adaptationSets = period.childrenNamed('AdaptationSet');
        adaptationSets.forEach(set => { this.parseAdaptationSet(set); });
    }


    parseAdaptationSet(set) {
        let type = set.attr.contentType;
        switch (type) {
            case 'text':
            case 'audio':
            case 'video':
                // needs to handle multiple, representations
                // let rep = set.childNamed('Representation');

                let reps = set.childrenNamed('Representation');
                reps.forEach(rep => {
                    this._representationId = rep.attr.id;
                    let segment = rep.childNamed("SegmentTemplate");
                    if (!segment) {
                        segment = set.childNamed("SegmentTemplate");
                    }
                    this.parseSegment(segment);
                });
                break;
            default:
                let representations = set.childrenNamed('Representation');
                representations.forEach(rep => { this.parseRepresentation(rep, type); });
                break;
        }
    }

    parseRepresentation(rep, type) {
        let segments = rep.childrenNamed('SegmentTemplate');
        this._representationId = rep.attr.id
        segments.forEach((seg) => { this.parseSegment(seg); });
    }

    parseSegment(segment) {
        let fragmentTimes = this.parseSegmentTimeline(segment.childNamed('SegmentTimeline'));
        this._media = segment.attr.media;
        let fragmentUrls = fragmentTimes.map(this.mapFragmentURL.bind(this));
        mainProcess.queueDownload(fragmentUrls, `${this._directory}/dash`);
    }

    parseSegmentTimeline(timeline) {
        let times = timeline.childrenNamed('S');
        let mappedTimes = times.map(this.mapFragment);
        return mappedTimes.reduce(this.segmentTimeReducer, []);
    }

    mapFragmentURL(fragment) {
        let modifiedMedia = this._media.replace("$RepresentationID$", this._representationId);
        modifiedMedia = typeof fragment.actualStart === 'undefined' || fragment.actualStart === null
            ? modifiedMedia.replace('-$Time$', '')
            : modifiedMedia.replace('$Time$', fragment.actualStart.toString());

        return `${this.getBaseUrl(this._manifestURL)}${modifiedMedia}`
    }

    mapFragment(obj) {
        return {
            start: typeof obj.attr.t !== 'undefined' ? Number(obj.attr.t) : undefined,
            duration: Number(obj.attr.d),
            repeat: typeof obj.attr.r !== 'undefined' ? Number(obj.attr.r) : undefined
        };
    }

    getBaseUrl() {
        return this._manifestURL.substr(0, this._manifestURL.lastIndexOf('/')).replace('.ism', '.ism/dash/');
    }

    segmentTimeReducer(prev, curr, index, currArray) {
        if (index === currArray.length - 1) return prev;
        let actualDuration = prev.length !== 0 ? prev[prev.length - 1].actualStart : 0;

        if (curr.start === 0) {
            // handle first fragment
            prev.push({});
            prev.push({ actualStart: curr.start });
            actualDuration = actualDuration + curr.duration;
            prev.push({ actualStart: curr.duration });
        } else {
            // normal fragment
            actualDuration = actualDuration + curr.duration;
            prev.push({ actualStart: actualDuration });
        }

        // handle fragment repeats 
        if (curr.repeat) {
            for (let i = 0; i < curr.repeat; i++) {
                actualDuration = actualDuration + curr.duration;
                prev.push({ actualStart: actualDuration });
            }
        }
        return prev;
    }
}
module.exports = ManifestParser;