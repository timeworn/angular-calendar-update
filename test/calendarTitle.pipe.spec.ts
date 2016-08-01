import {Component} from '@angular/core';
import {
  inject,
  async,
  TestComponentBuilder,
  ComponentFixture,
  addProviders
} from '@angular/core/testing';
import {expect} from 'chai';
import {
  CalendarTitle,
  CalendarConfig,
  CalendarDate,
  CalendarMomentDateFormatter,
  CalendarDateFormatter
} from './../angular2-calendar';

@Component({
  template: '{{ date | calendarTitle:view }}',
  pipes: [CalendarTitle]
})
class TestCmp {
  public date: Date;
  public view: string;
}

describe('calendarTitle pipe', () => {

  beforeEach(() => {
    addProviders([{
      provide: CalendarConfig, useValue: new CalendarConfig()
    }, {
      provide: CalendarDateFormatter, useClass: CalendarMomentDateFormatter
    }, CalendarDate]);
  });

  let builder: TestComponentBuilder;
  beforeEach(inject([TestComponentBuilder], (tcb) => {
    builder = tcb;
  }));

  it('should give the month view title', async(() => {
    builder.createAsync(TestCmp).then((fixture: ComponentFixture<TestCmp>) => {
      fixture.componentInstance.date = new Date('2016-01-01');
      fixture.componentInstance.view = 'month';
      fixture.detectChanges();
      expect(fixture.nativeElement.innerHTML).to.equal('January 2016');
    });
  }));

  it('should give the week view title', async(() => {
    builder.createAsync(TestCmp).then((fixture: ComponentFixture<TestCmp>) => {
      fixture.componentInstance.date = new Date('2016-01-04');
      fixture.componentInstance.view = 'week';
      fixture.detectChanges();
      expect(fixture.nativeElement.innerHTML).to.equal('Week 1 of 2016');
    });
  }));

  it('should give the day view title', async(() => {
    builder.createAsync(TestCmp).then((fixture: ComponentFixture<TestCmp>) => {
      fixture.componentInstance.date = new Date('2016-01-01');
      fixture.componentInstance.view = 'day';
      fixture.detectChanges();
      expect(fixture.nativeElement.innerHTML).to.equal('Friday, 1 January, 2016');
    });
  }));

  it('should throw if no valid view is given', async(() => {
    builder.createAsync(TestCmp).then((fixture: ComponentFixture<TestCmp>) => {
      fixture.componentInstance.date = new Date('2016-01-01');
      fixture.componentInstance.view = 'unknown';
      expect(() => fixture.detectChanges()).to.throw();
    });
  }));

});
