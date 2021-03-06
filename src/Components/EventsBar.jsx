import React, {PropTypes} from 'react';
import {Motion, spring} from 'react-motion';

import Events from './Events';
import FillingLine from './FillingLine';
import Faders from './Faders';
import HorizontalTimelineButtons from './HorizontalTimelineButtons';

import Constants from '../Constants';

class EventsBar extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      position: 0,
      maxPosition: 0,
    };

    this.touch = {
      coors: {
        x: 0,
        y: 0
      },
      isSwiping: false,
      started: false,
      threshold: 3
    }
  }

  componentWillMount() {
    document.body.addEventListener('keydown', this.handleKeydown);
  }

  componentWillUnmount() {
    document.body.removeEventListener('keydown', this.handleKeydown);
  }

  handleKeydown = (event) => {
    if (this.props.isKeyboardEnabled) {
      if (event.keyCode === Constants.LEFT_KEY || event.keyCode === Constants.RIGHT_KEY) {
        this.updateSlide(Constants.KEYMAP[event.keyCode]);
      } else if (event.keyCode === Constants.UP_KEY) {
        this.props.indexClick(Math.min(this.props.selectedIndex + 1, this.props.events.length - 1));
      } else if (event.keyCode === Constants.DOWN_KEY) {
        this.props.indexClick(Math.max(this.props.selectedIndex - 1, 0));
      }
    }
  }

  handleTouchStart = (event) => {
    const touchObj = event.touches[0];

    this.touch.coors.x = touchObj.pageX;
    this.touch.coors.y = touchObj.pageY;
    this.touch.isSwiping = false;
    this.touch.started = true;
  };

  handleTouchMove = (event) => {
    const wrapperWidth = Number(
      getComputedStyle(document.getElementsByClassName('events-wrapper')[0])['width'].replace('px', '')
    );

    if (!this.touch.started) {
      this.handleTouchStart(event);
      return;
    }

    const touchObj = event.touches[0];
    const dx = Math.abs(this.touch.coors.x - touchObj.pageX);
    const dy = Math.abs(this.touch.coors.y - touchObj.pageY);

    const isSwiping = dx > dy && dx > this.touch.threshold;

    if (isSwiping === true || dx > this.touch.threshold || dy > this.touch.threshold) {
      this.touch.isSwiping = isSwiping;
      const dX = this.touch.coors.x - touchObj.pageX; // amount scrolled
      this.touch.coors.x = touchObj.pageX;
      this.setState({
        position: this.state.position - (dX) // set new position
      });
    }
    if (this.touch.isSwiping !== true) {
      return;
    }
    // Prevent native scrolling
    event.preventDefault();
  };

  handleTouchEnd = (event) => {
    const wrapperWidth = Number(
      getComputedStyle(document.getElementsByClassName('events-wrapper')[0])['width'].replace('px', '')
    );
    const barWidth = Number(
      getComputedStyle(document.getElementsByClassName('events-bar')[0])['width'].replace('px', '')
    );
    if (this.state.position > 0) { // if already at start
      this.setState({position: 0});
    } else if ((barWidth - wrapperWidth + this.state.position) < 0) {
      // if scrolled more than the available space
      const pos = wrapperWidth - barWidth;
      this.setState({position: pos});
    }
    this.touch.coors.x = 0;
    this.touch.coors.y = 0;
    this.touch.isSwiping = false;
    this.touch.started = false;
  };


  componentWillReceiveProps(newProps) {
    this.updateSlide(undefined, newProps);
  }


  /**
   * This method translates the timeline by a certaing amount depending on if the direction passed
   * is left or right.
   *
   * @param {string} direction The direction towards which the timeline will translates
   * @param {object} the props to use during this calcuation
   * @return {undefind} Just modifies the value by which we need to translate the timeline in place
   */
  updateSlide = (direction, props = this.props) => {
    // the width of the timeline component between the two buttons (prev and next)
    const maxPosition = Math.min(props.visibleWidth - this.props.totalWidth, 0); // NEVER scroll to the right

    //  translate the timeline to the left('next')/right('prev')
    if (direction === Constants.RIGHT) {
      this.setState({
        position: Math.max((this.state.position - props.visibleWidth) + props.labelWidth, maxPosition),
        maxPosition
      });
    } else if (direction === Constants.LEFT) {
      this.setState({
        position: Math.min(0, (this.state.position + props.visibleWidth) - props.labelWidth),
        maxPosition
      });
    } else {
      //Make sure we are not scrolling outside the view
      this.setState({
        position: Math.max(this.state.position, maxPosition),
        maxPosition,
      });
    }
  };

  render() {
    //  creating an array of list items that have an onClick handler into which
    //  passing the index of the clicked entity.
    // NOTE: Improve timeline dates handeling and eventsMinLapse handling
    const touchEvents = this.props.isTouchEnabled
      ? {
        onTouchStart: this.handleTouchStart,
        onTouchMove: this.handleTouchMove,
        onTouchEnd: this.handleTouchEnd
      }
      : {};

    // filled value = distane from origin to the selected event
    const filledValue = this.props.events[this.props.index].distance;

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
        }}
        {...touchEvents}
      >
        <div
          className='events-wrapper'
          style={{
            position: 'relative',
            height: '100%',
            margin: '0 40px',
            overflow: 'hidden'
          }}
        >
          <Motion
            style={{
              X: spring(this.state.position, this.slidingMotion)
            }}
          >{({X}) =>
            <div
              className='events'
              style={{
                position: 'absolute',
                zIndex: 1,
                left: 0,
                top: 49,
                height: 2,
                background: this.props.styles.outline,
                width: this.props.totalWidth,
                WebkitTransform: `translate3d(${X}, 0, 0)px`,
                transform: `translate3d(${X}px, 0, 0)`
              }}
            >
              <Events
                events={this.props.events}
                selectedIndex={this.props.index}
                styles={this.props.styles}
                handleDateClick={this.props.indexClick}
                labelWidth={this.props.labelWidth}
              />
              <FillingLine
                filledValue={filledValue}
                fillingMotion={this.props.fillingMotion}
                styles={this.props.styles}
              />
            </div>
            }</Motion>
          </div>
          <Faders styles={this.props.styles}/>
          <HorizontalTimelineButtons
            maxPosition={this.state.maxPosition}
            position={this.state.position}
            styles={this.props.styles}
            updateSlide={this.updateSlide}
          />
      </div>
    );
  }
}

EventsBar.propTypes = {
  events: PropTypes.arrayOf(PropTypes.shape({
    distance: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  isTouchEnabled: PropTypes.bool.isRequired,
  totalWidth: PropTypes.number.isRequired,
  visibleWidth: PropTypes.number.isRequired,
  index: PropTypes.number,
  styles: PropTypes.object.isRequired,
  indexClick: PropTypes.func.isRequired,
  labelWidth: PropTypes.number.isRequired,
  fillingMotion: PropTypes.object.isRequired,
}


export default EventsBar;
