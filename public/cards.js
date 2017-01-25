/**
 *
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

class Cards {
  constructor () {
    this.cards = Array.from(document.querySelectorAll('.card'));

    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.update = this.update.bind(this);
    this.targetBCR = null;
    this.target = null;
    this.startX = 0;
    this.currentX = 0;
    this.screenX = 0;
    this.targetX = 0;
    this.moved = false;
    this.draggingCard = false;

    this.addEventListeners();

    requestAnimationFrame(this.update);
  }

  addEventListeners () {
    document.addEventListener('touchstart', this.onStart);
    document.addEventListener('touchmove', this.onMove);
    document.addEventListener('touchend', this.onEnd);

    document.addEventListener('mousedown', this.onStart);
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onEnd);
  }

  onStart (evt) {
    if (this.target)
      return;

    if (!evt.target.classList.contains('card'))
      return;

    this.target = evt.target;
    this.targetBCR = this.target.getBoundingClientRect();

    this.startX = evt.pageX || evt.touches[0].pageX;
    this.currentX = this.startX;

    this.draggingCard = true;
    this.target.style.willChange = 'transform';

    evt.preventDefault();
  }

  onMove (evt) {
    if (!this.target)
      return;

    this.currentX = evt.pageX || evt.touches[0].pageX;
  }

  onEnd (evt) {
    if (!this.target)
      return;

    this.targetX = 0;
    this.moved = false;
    let screenX = this.currentX - this.startX;
    const threshold = this.targetBCR.width * 0.35;
    if (Math.abs(screenX) > threshold) {
      this.targetX = (screenX > 0) ?
           this.targetBCR.width :
          -this.targetBCR.width;
    }

    this.draggingCard = false;
  }

  update () {

    requestAnimationFrame(this.update);

    if (!this.target)
      return;

    if (this.draggingCard) {
      this.screenX = this.currentX - this.startX;
    } else {
      this.screenX += (this.targetX - this.screenX) / 4;
    }

    const normalizedDragDistance =
        (Math.abs(this.screenX) / this.targetBCR.width);
    const opacity = 1 - Math.pow(normalizedDragDistance, 3);

    this.target.style.transform = `translateX(${this.screenX}px)`
    this.target.style.opacity = opacity

    // User has finished dragging.
    if (this.draggingCard)
      return;

    const isNearlyAtStart = (Math.abs(this.screenX) < 0.1);
    const isNearlyInvisible = (opacity < 0.01);

    // If the card is nearly gone.
    if (isNearlyInvisible && !this.moved) {

      // Bail if there's no target or it's not attached to a parent anymore.
      if (!this.target || !this.target.parentNode)
        return;

      this.target.parentNode.removeChild(this.target);

      if(this.targetX > 0) {
        const present = document.querySelector('.present-students')
        present.appendChild(this.target)
        this.target.style.opacity = 1
        this.resetTarget()
      } else if(this.targetX < 0) {
        const absent = document.querySelector('.absent-students')
        absent.appendChild(this.target)
        this.target.style.opacity = 1;
        this.resetTarget()
      }

      const targetIndex = this.cards.indexOf(this.target)
      console.log("slicing: ", this.target)
      this.cards.splice(targetIndex, 1)
      this.moved = true

      // Slide all the other cards.
      this.animateOtherCardsIntoPosition(targetIndex);

    } else if (isNearlyAtStart) {
      this.resetTarget();
    }
  }

  animateOtherCardsIntoPosition (startIndex) {
    // If removed card was the last one, there is nothing to animate.
    // Remove the target.
    if (startIndex === this.cards.length) {
      this.resetTarget();
      return;
    }

    const onAnimationComplete = evt => {
      const card = evt.target;
      card.removeEventListener('transitionend', onAnimationComplete);
      card.style.transition = '';
      card.style.transform = '';

      this.moved = false
      this.resetTarget()
    };

    // Set up all the card animations.
    for (let i = startIndex; i < this.cards.length; i++) {
      const card = this.cards[i];

      // Move the card down then slide it up.
      if(card) {
        card.style.transform = `translateY(${this.targetBCR.height + 20}px)`;
        card.addEventListener('transitionend', onAnimationComplete);
      }
    }

    // Now init them.
    requestAnimationFrame(_ => {
      for (let i = startIndex; i <= this.cards.length; i++) {
        let card = this.cards[i];

        // Move the card down then slide it up, with delay according to "distance"
        if(card) {
          console.log('i: ', i)
          console.log('move: ', i*50)
          card.style.transition = `transform 150ms cubic-bezier(0,0,0.31,1) ${i*50}ms`;
          card.style.transform = '';
        }
      }
    });
  }

  resetTarget () {
    if (!this.target)
      return;

    this.target.style.willChange = 'initial';
    this.target.style.transform = 'none';
    this.target = null;
  }

  setStudentCount() {
    const classSize = this.cards.length
    const here = document.querySelectorAll('.present-students').length
    const count = document.querySelector('#class-count')
    count.appendChild(`<h3> 13 / 15</h3>`)
  }
}

$('.get-cohort').on('click', (e) => {
  e.preventDefault
  let id = e.target.id.split("-")
  getStudents(id)
})

function getStudents(id) {
  let program = id[0]
  let cohort = id[1]
  let url = `/${program}/${cohort}`
  $.getJSON(url)
  .then((students) => {
    let container = $('.all-students')
    container.empty()
    students.map((student) => {
      container.append(`<div class='card'>${student}</div>`)
    })
  })
  .catch((err) => console.error(err));
}

window.addEventListener('load', () => new Cards());
