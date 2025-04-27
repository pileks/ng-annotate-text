(function() {
  'use strict';

  var ngAnnotateText = angular.module("ngAnnotateText", []);

  var annotationIdCounter = 0;

  function insertAt(text, index, string) {
    return text.substr(0, index) + string + text.substr(index);
  }

  function sortAnnotationsByEndIndex(annotations) {
    return annotations.sort(function(a, b) {
      if (a.endIndex < b.endIndex) {
        return -1;
      } else if (a.endIndex > b.endIndex) {
        return 1;
      }
      return 0;
    });
  }

  function parseAnnotations(text, annotations, indexOffset) {
    annotations = annotations || [];
    indexOffset = indexOffset || 0;

    if (annotations.length === 0) {
      return text;
    }
    annotations = sortAnnotationsByEndIndex(annotations);

    for (var i = annotations.length - 1; i >= 0; i--) {
      var annotation = annotations[i];
      text = insertAt(text, annotation.endIndex + indexOffset, "</span>");
      if (annotation.children.length) {
        text = parseAnnotations(text, annotation.children, annotation.startIndex + indexOffset);
      }
      text = insertAt(text, annotation.startIndex + indexOffset, "<span class=\"ng-annotate-text-annotation ng-annotate-text-" + annotation.id + " ng-annotate-text-type-" + annotation.type + "\" data-annotation-id=\"" + annotation.id + "\">");
    }
    return text;
  }

  function getAnnotationById(annotations, aId) {
    for (var i = 0; i < annotations.length; i++) {
      var a = annotations[i];
      if (aId === a.id) {
        return a;
      }
      if (a.children.length > 0) {
        var an = getAnnotationById(a.children, aId);
        if (an !== undefined) {
          return an;
        }
      }
    }
    return undefined;
  }

  ngAnnotateText.factory("NGAnnotateTextPopup", function() {
    return function(args) {
      args = angular.extend({
        scope: null,
        callbacks: {},
        template: "<div/>",
        $anchor: null,
        preferredAxis: 'x',
        offset: 0,
        positionClass: '{{position}}'
      }, args);

      angular.extend(this, args, {
        $el: angular.element(args.template),

        show: function(speed) {
          speed = speed || "fast";
          this.$el.fadeIn(speed);
          this.reposition();
          if (typeof this.callbacks.show === "function") {
            this.callbacks.show(this.$el);
          }
        },

        hide: function(speed) {
          speed = speed || "fast";
          this.$el.fadeOut(speed);
          if (typeof this.callbacks.hide === "function") {
            this.callbacks.hide(this.$el);
          }
        },

        isVisible: function() {
          return this.$el.is(":visible");
        },

        destroy: function(cb) {
          cb = cb || angular.noop;
          var scope = this.scope;
          var $el = this.$el;
          this.hide(function() {
            if (typeof cb === "function") {
              cb();
            }
            scope.$destroy();
            $el.remove();
          });
        },

        stopDestroy: function() {
          this.$el.stop(true).show("fast");
        },

        reposition: function() {
          var targetEl = this.$el[0];
          var anchorEl = this.$anchor[0];

          if (!(targetEl || anchorEl)) {
            return;
          }

          var pos = {
            left: null,
            top: null,
            target: targetEl.getBoundingClientRect(),
            anchor: anchorEl.getBoundingClientRect(),
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            scroll: {
              top: document.body.scrollTop,
              left: document.body.scrollLeft
            }
          };

          if (!(pos.target.width > 0 && pos.target.height > 0)) {
            return;
          }

          // Find first axis position
          var posX = this.getNewPositionOnAxis(pos, 'x');
          var posY = this.getNewPositionOnAxis(pos, 'y');

          if (this.preferredAxis === 'x') {
            if (posX && typeof posX.pos === 'number') {
              pos.left = posX.pos;
              pos.edge = posX.edge;
            } else if (posY) {
              pos.top = posY.pos;
              pos.edge = posY.edge;
            }
          } else {
            if (posY && typeof posY.pos === 'number') {
              pos.top = posY.pos;
              pos.edge = posY.edge;
            } else if (posX) {
              pos.left = posX.pos;
              pos.edge = posX.edge;
            }
          }

          // Center on second axis
          if (pos.left === null && pos.top === null) {
            // Center on X and Y axes
            pos.left = pos.scroll.left + (pos.viewport.width / 2) - (pos.target.width / 2);
            pos.top = pos.scroll.top + (pos.viewport.height / 2) - (pos.target.height / 2);
          } else if (pos.left === null) {
            // Center on X axis
            pos.left = this.getNewCenterPositionOnAxis(pos, 'x');
          } else if (pos.top === null) {
            // Center on Y axis
            pos.top = this.getNewCenterPositionOnAxis(pos, 'y');
          }

          this.$el
            .addClass(pos.edge && this.positionClass.replace("{{position}}", pos.edge))
            .css({
              top: Math.round(pos.top) || 0,
              left: Math.round(pos.left) || 0
            });

          return;
        },

        getNewPositionOnAxis: function(pos, axis) {
          var start = {x: 'left', y: 'top'}[axis];
          var end = {x: 'right', y: 'bottom'}[axis];
          var size = {x: 'width', y: 'height'}[axis];
          var axisPos;
          
          if (pos.anchor[start] - this.offset >= pos.target[size]) {
            axisPos = {
              pos: pos.scroll[start] + pos.anchor[start] - this.offset - pos.target[size],
              edge: start
            };
          } else if (pos.viewport[size] - pos.anchor[end] - this.offset >= pos.target[size]) {
            axisPos = {
              pos: pos.scroll[start] + pos.anchor[end] + this.offset,
              edge: end
            };
          }
          return axisPos;
        },

        getNewCenterPositionOnAxis: function(pos, axis) {
          var start = {x: 'left', y: 'top'}[axis];
          var size = {x: 'width', y: 'height'}[axis];
          var centerPos = pos.scroll[start] + pos.anchor[start] + (pos.anchor[size] / 2) - (pos.target[size] / 2);
          return Math.max(pos.scroll[start] + this.offset, Math.min(centerPos, pos.scroll[start] + pos.viewport[size] - pos.target[size] - this.offset));
        }
      });
    };
  });

  ngAnnotateText.factory("NGAnnotation", function() {
    var Annotation = function(data) {
      angular.extend(this, {
        id: annotationIdCounter++,
        startIndex: null,
        endIndex: null,
        data: {points: 0},
        type: "",
        children: []
      });

      if (data) {
        angular.extend(this, data);
      }
    };

    return Annotation;
  });

  ngAnnotateText.directive("ngAnnotateText", ['$rootScope', '$compile', '$http', '$q', '$controller', '$sce', 'NGAnnotation', 'NGAnnotateTextPopup',
    function($rootScope, $compile, $http, $q, $controller, $sce, NGAnnotation, NGAnnotateTextPopup) {
      return {
        restrict: "E",
        scope: {
          text: "=",
          annotations: "=",
          readonly: "=",
          popupController: "=",
          popupTemplateUrl: "=",
          tooltipController: "=",
          tooltipTemplateUrl: "=",
          onAnnotate: "=",
          onAnnotateDelete: "=",
          onAnnotateError: "=",
          onPopupShow: "=",
          onPopupHide: "=",
          popupOffset: "="
        },
        template: "<p ng-bind-html=\"content\"></p>",
        replace: true,

        compile: function(el, attr) {
          if (attr.readonly === undefined) {
            attr.readonly = false;
          }
          return this.postLink;
        },

        postLink: function($scope, element, attrs) {
          var POPUP_OFFSET = $scope.popupOffset !== undefined ? $scope.popupOffset : 10;

          var activePopup = null;
          var activeTooltip = null;

          // Cache the template when we fetch it
          var popupTemplateData = "";
          var tooltipTemplateData = "";

          var onAnnotationsChange = function() {
            if (!$scope.text || !$scope.text.length) {
              return;
            }
            var t = parseAnnotations($scope.text, $scope.annotations);
            $scope.content = $sce.trustAsHtml(t);
          };

          // Annotation parsing
          $scope.$watch("text", onAnnotationsChange);
          $scope.$watch("annotations", onAnnotationsChange, true);

          var clearPopup = function() {
            if (!activePopup) {
              return;
            }
            var tId = activePopup.scope.$annotation.id;
            activePopup.destroy(function() {
              if (activePopup && activePopup.scope.$annotation.id === tId) {
                activePopup = null;
              }
            });
          };

          var clearTooltip = function() {
            var tooltip = activeTooltip;
            if (!tooltip) {
              return;
            }
            tooltip.destroy(function() {
              if (activeTooltip === tooltip) {
                activeTooltip = null;
              }
            });
          };

          var clearPopups = function() {
            clearPopup();
            clearTooltip();
          };

          $scope.$on("$destroy", clearPopups);
          $scope.$on("ngAnnotateText.clearPopups", clearPopups);

          if ($scope.popupTemplateUrl) {
            $http.get($scope.popupTemplateUrl).then(function(response) {
              popupTemplateData = response.data;
            });
          }

          if ($scope.tooltipTemplateUrl) {
            $http.get($scope.tooltipTemplateUrl).then(function(response) {
              tooltipTemplateData = response.data;
            });
          }

          var removeChildren = function(annotation) {
            for (var i = annotation.children.length - 1; i >= 0; i--) {
              var a = annotation.children[i];
              removeChildren(a);
              a.children.splice(i, 1);
            }
          };

          var removeAnnotation = function(id, annotations) {
            for (var i = 0; i < annotations.length; i++) {
              var a = annotations[i];
              removeAnnotation(id, a.children);

              if (a.id === id) {
                removeChildren(a);
                annotations.splice(i, 1);
                return;
              }
            }
          };

          var createAnnotation = function() {
            var annotation = new NGAnnotation();
            var sel = window.getSelection();

            if (sel.isCollapsed) {
              throw new Error("NG_ANNOTATE_TEXT_NO_TEXT_SELECTED");
            }

            var range = sel.getRangeAt(0);

            if (range.startContainer !== range.endContainer) {
              throw new Error("NG_ANNOTATE_TEXT_PARTIAL_NODE_SELECTED");
            }

            var parentId, annotationParentCollection;
            
            if (range.startContainer.parentNode.nodeName === "SPAN") { // Is a child annotation
              var attrId = range.startContainer.parentNode.getAttribute("data-annotation-id");
              parentId = attrId !== null ? parseInt(attrId, 10) : undefined;
              
              if (parentId === undefined) {
                throw new Error("NG_ANNOTATE_TEXT_ILLEGAL_SELECTION");
              }
              var parentAnnotation = getAnnotationById($scope.annotations, parentId);
              annotationParentCollection = parentAnnotation.children;
            } else {
              annotationParentCollection = $scope.annotations;
            }

            // Does this selection has any siblings?
            if (annotationParentCollection.length) {
              // Yup, find the previous sibling
              var prevSiblingSpan = range.startContainer.previousSibling;
              if (prevSiblingSpan) {
                var prevSiblingAttrId = prevSiblingSpan.getAttribute("data-annotation-id");
                var prevSiblingId = prevSiblingAttrId !== null ? parseInt(prevSiblingAttrId, 10) : null;
                
                if (prevSiblingId === null) {
                  throw new Error("NG_ANNOTATE_TEXT_ILLEGAL_SELECTION");
                }

                var prevAnnotation = getAnnotationById($scope.annotations, prevSiblingId);
                annotation.startIndex = prevAnnotation.endIndex + range.startOffset;
                annotation.endIndex = prevAnnotation.endIndex + range.endOffset;
              } else {
                // Doesn't have a prev sibling, alrighty then
                annotation.startIndex = range.startOffset;
                annotation.endIndex = range.endOffset;
              }
            } else {
              // Nope
              annotation.startIndex = range.startOffset;
              annotation.endIndex = range.endOffset;
            }

            annotationParentCollection.push(annotation);
            clearSelection();
            return annotation;
          };

          var clearSelection = function() {
            if (document.selection) {
              document.selection.empty(); // Internet Explorer
            } else if (window.getSelection && window.getSelection().empty) {
              window.getSelection().empty(); // Chrome
            } else if (window.getSelection && window.getSelection().removeAllRanges) {
              window.getSelection().removeAllRanges(); // Firefox
            }
          };

          var onSelect = function(event) {
            if (popupTemplateData.length === 0) {
              return;
            }

            try {
              var annotation = createAnnotation();
              $scope.$apply();
              var $span = element.find(".ng-annotate-text-" + annotation.id);
            } catch (ex) {
              if ($scope.onAnnotateError) {
                $scope.onAnnotateError(ex);
              }
              return;
            }

            clearPopups();
            loadAnnotationPopup(annotation, $span, true);
          };

          var onClick = function(event) {
            if (popupTemplateData.length === 0) {
              return;
            }

            var $target = angular.element(event.target);
            var attrId = $target.attr("data-annotation-id");
            var targetId = attrId !== undefined ? parseInt(attrId, 10) : undefined;

            if (targetId === undefined) {
              return;
            }

            if (activePopup && activePopup.scope.$annotation.id === targetId) {
              clearPopup();
              return;
            }
            
            var annotation = getAnnotationById($scope.annotations, targetId);
            clearPopups();
            loadAnnotationPopup(annotation, $target, false);
          };

          var onMouseEnter = function(event) {
            if (tooltipTemplateData.length === 0) {
              return;
            }

            event.stopPropagation();
            var $target = angular.element(event.target);
            var attrId = $target.attr("data-annotation-id");
            var targetId = attrId !== undefined ? parseInt(attrId, 10) : undefined;

            if (activeTooltip && activeTooltip.scope.$annotation.id === targetId) {
              activeTooltip.stopDestroy();
              return;
            } else {
              clearTooltip();
            }

            if (targetId === undefined) {
              return;
            }

            var annotation = getAnnotationById($scope.annotations, targetId);

            // We don't want to show the tooltip if a popup with the annotation is open,
            // or if the tooltip has both no comment and points
            if (activePopup || (!annotation.data.comment && !annotation.data.points)) {
              return;
            }

            var tooltip = new NGAnnotateTextPopup({
              scope: $rootScope.$new(),
              template: "<div class='ng-annotate-text-tooltip' />",
              positionClass: "ng-annotate-text-tooltip-docked ng-annotate-text-tooltip-docked-{{position}}",
              $anchor: $target,
              preferredAxis: 'y',
              offset: POPUP_OFFSET
            });
            tooltip.scope.$annotation = annotation;

            activeTooltip = tooltip;

            var locals = {
              $scope: tooltip.scope,
              $template: tooltipTemplateData
            };

            tooltip.$el.html(locals.$template);
            tooltip.$el.appendTo("body");

            if ($scope.tooltipController) {
              var controller = $controller($scope.tooltipController, locals);
              tooltip.$el.data("$ngControllerController", controller);
              tooltip.$el.children().data("$ngControllerController", controller);
            }

            $compile(tooltip.$el)(tooltip.scope);
            tooltip.scope.$apply();
            tooltip.show();
          };

          var onMouseLeave = function(event) {
            event.stopPropagation();

            var $target = angular.element(event.target);
            var attrId = $target.attr("data-annotation-id");
            var targetId = attrId !== undefined ? parseInt(attrId, 10) : undefined;

            if (targetId === undefined) {
              return;
            }

            clearTooltip();
          };

          var loadAnnotationPopup = function(annotation, anchor, isNew) {
            var popup = new NGAnnotateTextPopup({
              scope: $rootScope.$new(),
              callbacks: {
                show: $scope.onPopupShow,
                hide: $scope.onPopupHide
              },
              template: "<div class='ng-annotate-text-popup' />",
              positionClass: "ng-annotate-text-popup-docked ng-annotate-text-popup-docked-{{position}}",
              $anchor: anchor,
              offset: POPUP_OFFSET
            });

            popup.scope.$isNew = isNew;
            popup.scope.$annotation = annotation;
            popup.scope.$readonly = $scope.readonly;

            popup.scope.$reject = function() {
              removeAnnotation(annotation.id, $scope.annotations);

              if ($scope.onAnnotateDelete) {
                $scope.onAnnotateDelete(annotation);
              }
              clearPopup();
              return;
            };

            popup.scope.$close = function() {
              if ($scope.onAnnotate) {
                $scope.onAnnotate(popup.scope.$annotation);
              }
              clearPopup();
              return;
            };

            activePopup = popup;

            var locals = {
              $scope: popup.scope,
              $template: popupTemplateData
            };

            popup.$el.html(locals.$template);
            popup.$el.appendTo("body");

            if ($scope.popupController) {
              var controller = $controller($scope.popupController, locals);
              popup.$el.data("$ngControllerController", controller);
              popup.$el.children().data("$ngControllerController", controller);
            }

            $compile(popup.$el)(popup.scope);
            popup.scope.$apply();
            popup.show();
          };

          element.on("mouseenter", "span", onMouseEnter);
          element.on("mouseleave", "span", onMouseLeave);

          element.on("mouseup", function(event) {
            // We need to determine if the user actually selected something
            // or if he just clicked on an annotation
            var selection = window.getSelection();
            if (!selection.isCollapsed && !$scope.readonly) {
              // User has selected something
              onSelect(event);
            } else if (selection.isCollapsed && event.target.nodeName === "SPAN") {
              onClick(event);
            } else if (selection.isCollapsed) {
              clearPopups();
            }
          });
        }
      };
    }
  ]);
})(); 