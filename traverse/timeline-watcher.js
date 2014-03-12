var TimelineWatcher = {}


TimelineWatcher.Mapper = function(options) {
  this.$timeline = $(options.timeline_id);
  this.$map = $(options.map_id);

  var _this = this;
  this.$timeline.on("slideChanged", function(e, data) {
    _this.trace(e, data);
  });
}

TimelineWatcher.Mapper.prototype.trace = function(e, watcher) {
  var position = watcher.section.position;
  for(var i=0;i<watcher.sections.length;i++) {
    if(watcher.sections[i].position === position) {
      this.activate(watcher.sections[i], true);
    } else if(watcher.sections[i].position < position) {
      this.activate(watcher.sections[i]);
    } else {
      this.deactivate(watcher.sections[i]);
    }
  }
}

TimelineWatcher.Mapper.prototype.activate = function(section, animate) {
  // d3.select("#route-" + section.position).attr('class', 'route active');
  $("#route-" + section.position).trigger('activate');
}

TimelineWatcher.Mapper.prototype.deactivate = function(section) {
  // d3.select("#route-" + section.position).attr('class', 'route');
  var route = $("#route-" + section.position);
  // if(route.hasClass('active')) {
  route.trigger('deactivate');
  // }
}

TimelineWatcher.Section = function(identifier, position) {
  this.identifier = identifier;
  this.dates = [];
  this.position = position;
}

TimelineWatcher.Section.prototype.add = function(date) {
  this.dates.push(date);
}

TimelineWatcher.Section.prototype.length = function(date) {
  return this.dates.length;
}

TimelineWatcher.Section.prototype.includesSlide = function(slide) {
  return this.getPosition(slide) !== -1;
}

TimelineWatcher.Section.prototype.getPosition = function(slide) {
  for(var i=0;i<this.dates.length;i++) {
    if(this.dates[i].uniqueid === slide.id.replace("slide_","")) {
      return i;
    }
  }
  return -1;
}

TimelineWatcher.Section.prototype.dateFromSlide = function(slide) {
  for(var i=0;i<this.dates.length;i++) {
    if(this.dates[i].uniqueid === slide.id.replace("slide_","")) {
      return this.dates[i];
    }
  }
  return;
}

TimelineWatcher.Watcher = function(id) {
  this.$timeline = $(id);
  this.bindEvents();
  this.sections = [];
}

TimelineWatcher.Watcher.prototype.bindEvents = function() {
  var _this = this;
  this.$timeline.on("PROCESSED", function(e, data) {
    _this.datesLoaded(e, data);
  });
  this.$timeline.on("LOADED", function(e, data) {
    _this.timelineLoaded(e, data);
  });
  this.$timeline.on("VIEWED", ".slider-item", function(e, data) {
    _this.slideChanged(e, data, this);
  });
}

TimelineWatcher.Watcher.prototype.datesLoaded = function(e, data) {
  if(data && data.dates) {
    console.log("dates are loaded");
    this.dates = data.dates;
    this.extractIdentifiers();
    this.$timeline.trigger("datesLoaded", this)
  }
}

TimelineWatcher.Watcher.prototype.timelineLoaded = function(e, data) {
  if(data && data.slides) {
    console.log("timeline is loaded");
    this.$timeline.trigger("timelineLoaded", this)
    this.slides = data.slides;
  }
}

TimelineWatcher.Watcher.prototype.slideChanged = function(e, data) {
  this.slide = data.slide;
  this.position = data.current_position;
  this.section = this.sectionWithSlide(this.slide);
  if(this.section === undefined) {
    return
  }
  this.date = this.section.dateFromSlide(this.slide);
  this.$timeline.trigger("slideChanged", this)
}

TimelineWatcher.Watcher.prototype.sectionWithSlide = function(slide) {
  for(var i=0;i<this.sections.length;i++) {
    if(this.sections[i].includesSlide(slide)) {
      return this.sections[i];
    }
  }
}

TimelineWatcher.Watcher.prototype.percentThroughSection = function() {
  return (this.section.getPosition(this.slide)) / (this.section.length()) * 100;
}

TimelineWatcher.Watcher.prototype.extractIdentifiers = function() {
  for(var i=0;i<this.dates.length;i++) {
    var date = this.dates[i];

    if(this.sections.length == 0) {
      this.sections.push(new TimelineWatcher.Section(date.identifier, 0));
    }

    var last_section = this.sections[this.sections.length - 1];
console.log(date.identifier);
    if(date.identifier === last_section.identifier || date.identifier === undefined  || date.identifier === "") {
      last_section.add(this.dates[i]);
    } else {
      var new_section = new TimelineWatcher.Section(date.identifier, this.sections.length);
      this.sections.push(new_section);
      new_section.add(date);
    }
  }
}
