import { render, RenderPosition } from '../framework/render.js';
import { getOffersByPointType, updateItem, sortByDay, sortByPrice } from '../untils/common.js';
import TripEventsListView from '../view/trip-events-view.js';
import SortView from '../view/sort-view.js';
import ListEmptyView from '../view/list-empty-view.js';
import PointPresenter from './point-presenter.js';
import { SortType } from '../const.js';

export default class BoardPresenter {
  #offersModel = null;
  #offers = [];
  #destinationsModel = null;
  #boardContainer = null;
  #points = [];
  #destinations = [];
  #pointsModel = null;
  #tripEventsList = new TripEventsListView();
  #pointPresenters = new Map();
  #currentSort = SortType.DAY;
  #sourcedPoints = [];

  constructor({
    boardContainer,
    pointsModel,
    destinationsModel,
    offersModel
  }) {
    this.#boardContainer = boardContainer;
    this.#pointsModel = pointsModel;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
  }

  init() {
    this.#points = [...this.#pointsModel.points].sort(sortByDay);
    this.#sourcedPoints = [...this.#pointsModel.points].sort(sortByDay);
    this.#destinations = [...this.#destinationsModel.destinations];
    this.#offers = [...this.#offersModel.offers];
    this.#renderBoard();
  }

  #renderPoint(point) {

    const pointPresenter = new PointPresenter({
      pointsListContainer: this.#tripEventsList.element,
      onDataChange: this.#handlePointChange,
      onModeChange: this.#handleModeChange,
      allDestinations: this.#getDestinationsList(),
      getOffersByPointType: this.#getOffersByPointType
    });

    pointPresenter.init(point);
    this.#pointPresenters.set(point.id, pointPresenter);
  }

  #renderBoard() {
    if (this.#points.length < 1) {
      this.#renderNoPoints();
      return;
    }

    this.#renderSort();
    this.#renderPointsList();
  }

  #renderNoPoints() {
    render(new ListEmptyView(), this.#boardContainer);
  }

  #renderSort() {
    render(new SortView({
      onSortChange: this.#handleSortChange
    }), this.#boardContainer.firstElementChild, RenderPosition.AFTEREND);
  }

  #renderPointsList() {
    render(this.#tripEventsList, this.#boardContainer);

    for (let i = 0; i < this.#points.length; i++) {
      this.#renderPoint(this.#points[i]);
    }
  }

  #clearPointsList() {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();
  }

  #sortPoints(sortType) {
    switch (sortType) {
      case SortType.DAY:
        this.#points = [...this.#sourcedPoints];
        break;
      case SortType.PRICE:
        this.#points.sort(sortByPrice);
    }

    this.#currentSort = sortType;
  }

  #getDestinationsList = () => this.#destinations;
  #getOffersByPointType = (pointType) => getOffersByPointType(pointType, this.#offers);

  #handlePointChange = (updatedPoint) => {
    this.#points = updateItem(this.#points, updatedPoint);
    this.#sourcedPoints = updateItem(this.#sourcedPoints, updatedPoint);
    this.#pointPresenters.get(updatedPoint.id).init(updatedPoint);
  };

  #handleModeChange = () => {
    this.#pointPresenters.forEach((presenter) => presenter.resetView());
  };

  #handleSortChange = (sortType) => {
    if (this.#currentSort === sortType) {
      return;
    }

    this.#sortPoints(sortType);
    this.#clearPointsList();
    this.#renderPointsList();
  };
}
