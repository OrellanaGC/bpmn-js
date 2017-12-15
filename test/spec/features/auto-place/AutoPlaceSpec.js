'use strict';

require('../../../TestHelper');

/* global bootstrapModeler, inject */

var autoPlaceModule = require('../../../../lib/features/auto-place'),
    modelingModule = require('../../../../lib/features/modeling'),
    selectionModule = require('diagram-js/lib/features/selection'),
    labelEditingModule = require('../../../../lib/features/label-editing'),
    coreModule = require('../../../../lib/core');


describe('features/auto-place', function() {

  describe('element placement', function() {

    var diagramXML = require('./AutoPlace.bpmn');

    before(bootstrapModeler(diagramXML, {
      modules: [
        coreModule,
        modelingModule,
        autoPlaceModule,
        selectionModule
      ]
    }));


    function autoPlace(cfg) {

      var element = cfg.element,
          behind = cfg.behind,
          expectedBounds = cfg.expectedBounds;

      return inject(function(autoPlace, elementRegistry, elementFactory) {

        var sourceEl = elementRegistry.get(behind);

        // assume
        expect(sourceEl).to.exist;

        if (typeof element === 'string') {
          element = { type: element };
        }

        var shape = elementFactory.createShape(element);

        // when
        var placedShape = autoPlace.append(sourceEl, shape);

        // then
        expect(placedShape).to.have.bounds(expectedBounds);
      });
    }


    describe('should place bpmn:FlowNode', function() {

      it('at default distance after START_EVENT_1', autoPlace({
        element: 'bpmn:Task',
        behind: 'START_EVENT_1',
        expectedBounds: { x: 1052, y: 224, width: 100, height: 80 }
      }));


      it('at incoming distance after TASK_0', autoPlace({
        element: 'bpmn:Task',
        behind: 'TASK_0',
        expectedBounds: { x: 262, y: 54, width: 100, height: 80 }
      }));


      it('at incoming distance / quorum after TASK_5', autoPlace({
        element: 'bpmn:Task',
        behind: 'TASK_5',
        expectedBounds: { x: 296, y: 390, width: 100, height: 80 }
      }));


      it('at existing outgoing / below TASK_2', autoPlace({
        element: 'bpmn:Task',
        behind: 'TASK_1',
        expectedBounds: { x: 279, y: 293, width: 100, height: 80 }
      }));


      it('ignoring existing, far away outgoing of TASK_3', autoPlace({
        element: 'bpmn:Task',
        behind: 'TASK_3',
        expectedBounds: { x: 746, y: 127, width: 100, height: 80 }
      }));


      it('behind bpmn:SubProcess', autoPlace({
        element: 'bpmn:Task',
        behind: 'SUBPROCESS_1',
        expectedBounds: { x: 925, y: 368, width: 100, height: 80 }
      }));

    });


    describe('should place bpmn:DataStoreReference', function() {

      it('bottom right of source', autoPlace({
        element: 'bpmn:DataStoreReference',
        behind: 'TASK_3',
        expectedBounds: { x: 769, y: 247, width: 50, height: 50 }
      }));

    });


    describe('should place bpmn:TextAnnotation', function() {

      it('top right of source', autoPlace({
        element: 'bpmn:TextAnnotation',
        behind: 'TASK_2',
        expectedBounds: { x: 409, y: 103, width: 100, height: 30 }
      }));


      it('above existing', autoPlace({
        element: 'bpmn:TextAnnotation',
        behind: 'TASK_3',
        expectedBounds: { x: 726, y: -4, width: 100, height: 30 }
      }));

    });

  });


  describe('modeling flow', function() {

    var diagramXML = require('./AutoPlace.bpmn');

    before(bootstrapModeler(diagramXML, {
      modules: [
        coreModule,
        modelingModule,
        autoPlaceModule,
        selectionModule,
        labelEditingModule
      ]
    }));


    it('should select + direct edit on autoPlace', inject(
      function(autoPlace, elementRegistry, elementFactory, selection, directEditing) {

        // given
        var el = elementFactory.createShape({ type: 'bpmn:Task' });

        var source = elementRegistry.get('TASK_2');

        // when
        var newShape = autoPlace.append(source, el);

        // then
        expect(selection.get()).to.eql([ newShape ]);

        expect(directEditing.isActive()).to.be.true;
        expect(directEditing._active.element).to.equal(newShape);
      }
    ));

  });


  describe('multi connection handling', function() {

    var diagramXML = require('./AutoPlace.multi-connection.bpmn');

    before(bootstrapModeler(diagramXML, {
      modules: [
        coreModule,
        modelingModule,
        autoPlaceModule,
        selectionModule
      ]
    }));


    it('should ignore multiple source -> target connections', inject(
      function(autoPlace, elementRegistry, elementFactory, selection, directEditing) {

        // given
        var element = elementFactory.createShape({ type: 'bpmn:Task' });

        var source = elementRegistry.get('TASK_1');
        var alignedElement = elementRegistry.get('TASK_3');

        // when
        var newShape = autoPlace.append(source, element);

        // then
        expect(newShape.x).to.eql(alignedElement.x);
      }
    ));

  });

});