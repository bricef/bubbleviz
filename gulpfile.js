var gulp = require("gulp");
var sass = require("gulp-sass");
var livereload = require("gulp-livereload");
var del = require("del");

var config = {
  SRC: './src/js/**/*', // js source files to be compiled (or not)
  TARGET: './extension/', // what's given to chrome
  TARGET_FILES: './extension/**/*',
  STATIC: './static/**/*', // static assets images, css, third party js
  SASS: './src/sass/**/*.scss', // styles origin
  CSS: './extension/css',
  MANIFEST: './manifest.json'
};


gulp.task("main", ["js", "sass", "static"], function(){

});

gulp.task("clean", function(){
  return del(config.TARGET);
})


gulp.task("static", function(){
  return gulp.src([config.STATIC, config.MANIFEST]).pipe(gulp.dest(config.TARGET));
});

gulp.task("manifest", function(){
  return gulp.src([config.MANIFEST]).pipe(gulp.dest(config.TARGET));
})

gulp.task("js", function(){
  return gulp.src(config.SRC).pipe(gulp.dest(config.TARGET+"src/"));
});

gulp.task("sass", function(){
  return gulp.src(config.SASS)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(config.CSS));
});


gulp.task("watch", ["static", "js", "sass"], function(){
  gulp.watch([config.MANIFEST], ['manifest'])
  gulp.watch([config.STATIC], ['static']);
  gulp.watch([config.SRC], ['js']);
  gulp.watch([config.SASS], ['sass']);

  livereload.listen();
  gulp.watch(config.TARGET_FILES).on('change', livereload.reload);
});
