/* ============================
   DASHBOARD API LOGIC
   ============================ */

document.addEventListener("DOMContentLoaded", () => {
  const cardsContainer = document.getElementById("dashboardCards");
  const searchInput = document.getElementById("cardSearch");
  const reloadBtn = document.getElementById("reloadDeckBtn");
  const historyList = document.getElementById("searchHistory");

  let allCards = [];
  let history = JSON.parse(localStorage.getItem("cardSearchHistory")) || [];

  /* LOAD SEARCH HISTORY */
  function renderHistory() {
    historyList.innerHTML = "";
    history.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      li.onclick = () => {
        searchInput.value = item;
        filterCards();
      };
      historyList.appendChild(li);
    });
  }

  renderHistory();

  /* SAVE HISTORY */
  function addToHistory(term) {
    if (!term.trim()) return;

    history.unshift(term);
    history = history.slice(0, 5);
    localStorage.setItem("cardSearchHistory", JSON.stringify(history));
    renderHistory();
  }

  /* FETCH A NEW DECK */
  async function loadDeck() {
    cardsContainer.innerHTML = "<p>Loading deck...</p>";

    try {
      const response = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
      const data = await response.json();

      const draw = await fetch(`https://deckofcardsapi.com/api/deck/${data.deck_id}/draw/?count=5`);
      const cardData = await draw.json();

      allCards = cardData.cards;
      renderCards(allCards);

    } catch (err) {
      cardsContainer.innerHTML = "<p style='color:red'>Failed to load deck.</p>";
    }
  }

  loadDeck();

  /* DISPLAY CARDS */
  function renderCards(cards) {
    cardsContainer.innerHTML = "";
    cards.forEach(card => {
      const cardEl = document.createElement("div");
      cardEl.className = "dashboard-card fade-in";
      cardEl.innerHTML = `
        <img src="${card.image}" alt="${card.value} of ${card.suit}">
        <h3>${card.value} of ${card.suit}</h3>
      `;
      cardsContainer.appendChild(cardEl);
    });
  }

  /* FILTER CARDS */
  function filterCards() {
    const term = searchInput.value.toLowerCase();
    addToHistory(term);

    const filtered = allCards.filter(c =>
      c.value.toLowerCase().includes(term) ||
      c.suit.toLowerCase().includes(term)
    );

    renderCards(filtered);
  }

  searchInput.addEventListener("input", filterCards);
  reloadBtn.addEventListener("click", loadDeck);
});
