<template>
  <div class="container">
    <b-modal
      hide-footer
      hide-header
      no-close-on-esc
      no-close-on-backdrop
      v-model="modalShow"
    >
      <div class="d-block">
        <b-form-group
          id="input-group-1"
          label="Username :"
          label-for="input-1"
        >
          <b-form-input
            id="input-1"
            v-model="username"
            type="text"
            placeholder="Username"
            v-on:keyup.enter="login()"
          ></b-form-input>
        </b-form-group>

      </div>
    </b-modal>
    <div
      v-if="$store.state.user"
      class="row"
    >
      <div class="col-md-3 text-left text-white">
        <p>Click : {{ turns }}</p>
        <p>My Best : {{ myBest == 0 ? '-' : myBest }}</p>
        <p>Global Best : {{ globalBest }}</p>
        <button
          class="btn btn-secondary"
          @click="resetGame()"
        >New game</button>
      </div>
      <div class="col-md-9">
        <div class="cards">
          <div class="row">
            <div
              class="col-3"
              v-for="(card, index) in cards"
              :key="`card-${index}`"
            >
              <div
                class="card"
                :class="{ flipped: card.flipped, found: card.found }"
                @click="flipCard(card)"
              >
                <div class="back"></div>
                <div class="front">{{ card.number ? card.number : '' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="splash"
      v-if="showSplash"
    >
      <div class="overlay"></div>
      <div class="content">
        <div class="title">You won!</div>
        <div class="score">Score: {{ turns }}</div>
        <button
          class="newGame"
          @click="resetGame()"
        >New game</button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data: () => ({
    username: '',
    modalShow: true,
    showSplash: false,
    cards: [],
    started: false,
    turns: 0,
    flipBackTimer: null,
    globalBest: 0,
    myBest: 0,
  }),
  methods: {
    async login () {
      await this.$axios.
        $post(`login`, {
          username: this.username
        })
        .then(response => {
          if (response.status === 'success') {
            this.$store.commit('setUser', response.data.user)
            this.modalShow = false
            this.startGame()
            this.myBest = response.data.score
            this.globalBest = response.data.global
          }
        })
        .catch(error => {
          alert("เกิดข้อผิดพลาด, กรุณาติดต่อผู้ดูแลระบบ");
        })
        .finally(() => {
        })
    },
    async getGlobalBest () {
      await this.$axios
        .$get(`global-best`)
        .then(response => {
          if (response.status === 'success') {
            this.globalBest = response.data.globalBest
          }
        })
        .catch(error => {
          alert("เกิดข้อผิดพลาด, กรุณาติดต่อผู้ดูแลระบบ");
        })
        .finally(() => {
        })
    },
    async startGame () {
      await this.$axios
        .$get(`start-game`, {
          params: {
            user: this.$store.state.user
          }
        })
        .then(response => {
          if (response.status === 'success') {
            this.cards = response.data
            this.started = true
          }
        })
        .catch(error => {
          alert("เกิดข้อผิดพลาด, กรุณาติดต่อผู้ดูแลระบบ");
        })
        .finally(() => {
        })
    },
    async finishGame () {
      this.started = false;
      this.showSplash = true;
      await this.$axios
        .$post(`save-score`, {
          score: this.turns,
          user: this.$store.state.user
        })
        .then(response => {
          if (response.status === 'success') {
            this.globalBest = response.data.global
            this.myBest = response.data.score
          }
        })
        .catch(error => {
          alert("เกิดข้อผิดพลาด, กรุณาติดต่อผู้ดูแลระบบ");
        })
        .finally(() => {
        })
    },
    resetGame () {
      this.showSplash = false;
      this.turns = 0;
      this.started = false;
      this.startGame();
    },

    flippedCards () {
      return _.filter(this.cards, card => card.flipped);
    },

    async sameFlippedCard () {
      let flippedCards = this.flippedCards();

      let result = false;
      if (flippedCards.length == 2) {
        await this.$axios
          .$post(`check-card`, {
            card1: flippedCards[0].id,
            card2: flippedCards[1].id,
            user: this.$store.state.user
          })
          .then(response => {
            if (response.status === 'success') {
              if (response.data.result == true) {
                result = true;
              }
            }
          })
          .catch(error => {
            alert("เกิดข้อผิดพลาด, กรุณาติดต่อผู้ดูแลระบบ");
          })
          .finally(() => {
          })
      }
      return result
    },

    setCardFounds () {
      _.each(this.cards, (card) => {
        if (card.flipped)
          card.found = true;

      });
    },

    clearNumber () {
      _.each(this.cards, (card) => {
        if (card.found != true)
          card.number = '';

      });
    },

    checkAllFound () {
      let foundCards = _.filter(this.cards, card => card.found);
      if (foundCards.length == this.cards.length)
        return true;
    },

    async openCard (card) {
      await this.$axios
        .$get(`open-card`, {
          params: {
            card: card.id,
            user: this.$store.state.user
          }
        })
        .then(response => {
          if (response.status === 'success') {
            card.number = response.data.number
            this.turns = response.data.score
          }
        })
        .catch(error => {
          alert("เกิดข้อผิดพลาด, กรุณาติดต่อผู้ดูแลระบบ");
        })
        .finally(() => {
        })
    },

    async flipCard (card) {
      if (card.found || card.flipped) return;

      if (!this.started) {
        this.startGame();
      }
      let flipCount = this.flippedCards().length;
      if (flipCount == 0) {

        await this.openCard(card);
        card.flipped = !card.flipped;

        this.cards.splice(this.cards.length)
      }
      else if (flipCount == 1) {

        await this.openCard(card);
        card.flipped = !card.flipped;
        const checkSame = await this.sameFlippedCard()
        if (checkSame) {
          // Match!
          this.flipBackTimer = setTimeout(() => {
            this.clearFlipBackTimer();
            this.setCardFounds();
            this.clearFlips();

            if (this.checkAllFound()) {
              this.finishGame();
            }

          }, 200);

          this.cards.splice(this.cards.length)
        } else {
          // Wrong match
          this.flipBackTimer = setTimeout(() => {
            this.clearNumber();
            this.clearFlipBackTimer();
            this.clearFlips();
          }, 1000);

          this.cards.splice(this.cards.length)
        }
      }
    },
    clearFlips () {
      _.map(this.cards, card => card.flipped = false);
    },
    clearFlipBackTimer () {
      clearTimeout(this.flipBackTimer);
      this.flipBackTimer = null;
    }
  },
  mounted () {
    document.addEventListener('contextmenu', event => event.preventDefault());
  },

}

</script>
<style>
</style>
