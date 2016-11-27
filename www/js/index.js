document.addEventListener("deviceready", deviceReady, false);

var app = {
  current_city_data : [],

  loadDataBase : function(){
    this.data_base = new loki("weather.db", {
        autosave: true,
        autosaveInterval: 1000,
        autoload: true
      });

    this.data_base.loadDatabase();

    var favorite_cities = this.data_base.getCollection("favorite-cities");

    if (!favorite_cities){
      favorite_cities = this.data_base.addCollection("favorite-cities")
    }

    app.setDataBaseData();
  },

  getDataBase : function(){
    return this.data_base;
  },

  getCollection : function(){
    return this.data_base.getCollection("favorite-cities");
  },

  addCity : function(city_data){
    var favorite_cities = app.getCollection();

    var city = {
      name: city_data[0],
      id : city_data[1]
    }

    favorite_cities.insert(city);
    app.showCity(city);
  },

  dataBaseHasCity : function(city_name){
    var favorite_cities = app.getCollection();

    if (favorite_cities.find({name : {"$eq" : city_name}}).length > 0){
      return true
    }
    return false
  },

  setDataBaseData : function(){
    var favorite_cities_list = app.getCollection().data;

    i = 0;
    while (i < favorite_cities_list.length){
      app.showCity(favorite_cities_list[i]);
      i++;
    }
  },

  showCity : function(city){
    var model =  '<button type="button" class="list-group-item list-group-item-action city-name" data-id="' + city.$loki + '">' + city.name + '</button>';
    $("#favorite-cities-list").append(model);
  },

  callAjaxByName : function(city, url, success, error){
    $.ajax({
      method: "GET",
      url: url,
      data: {
        q: city,
        lang: "en",
        units: "metric",
        APPID: "da4ab94625497016f82d068b8e40a5f0"
      },
      dataType: "json",
      success: success,
      error: error
    });
  },

  callAjaxById : function(id, url, success, error){
    $.ajax({
      method: "GET",
      url: url,
      data: {
        id: id,
        lang: "en",
        units: "metric",
        APPID: "da4ab94625497016f82d068b8e40a5f0"
      },
      dataType: "json",
      success: success,
      error: error
    });
  },

  setCurrentInformation : function(data){
    $("#body-collapse").collapse("hide");
    setTimeout(function(){
      var title_box = $("#current-weather-card-title");
      title_box.html(data.name);
      title_box.append("<img class='pull-right' src='http://openweathermap.org/img/w/" + data.weather[0].icon + ".png'>");
      var father = $("#current-weather-list");
      father.find(".description").html("Weather: " + data.weather[0].description.toLowerCase());
      father.find(".min").html("Min: " + data.main.temp_min + "ºC");
      father.find(".max").html("Max: " + data.main.temp_max + "ºC");
      father.find(".humidity").html("Humidity: " + data.main.humidity + "%");
      $("#body-collapse").collapse("show");
    }, 1000);
  },

  setForecastInformation : function(data){
    var array = data.list
    i = 1;
    while (i < 6){
      var current_data = array[(i - 1) * 8 + 3];
      var father = $(".day-" + i);
      father.find(".title-date").html(current_data.dt_txt.slice(8, 10) + "/" + current_data.dt_txt.slice(5, 7));
      father.find(".title-date").append("<img class='pull-right' src='http://openweathermap.org/img/w/" + current_data.weather[0].icon + ".png'>");
      father.find(".description").html("Weather: " + current_data.weather[0].description.toLowerCase());
      father.find(".min").html("Min: " + current_data.main.temp_min + "ºC");
      father.find(".max").html("Max: " + current_data.main.temp_max + "ºC");
      father.find(".humidity").html("Humidity: " + current_data.main.humidity + "%");
      i++;
    }
  },

  anErrorHappened : function(data){
    $("#body-collapse").collapse("hide");
    var model = '<div data-role="none" class="alert alert-danger alert-dismissible fade in centered" role="alert">' +
                  '<button data-role="none" type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                    '<span aria-hidden="true">&times;</span>' +
                  '</button>' +
                    'Um erro ocorreu em sua requisição! Tente novamente mais tarde.' +
                '</div>';
    $("#alert-wrapper").html(model);
  }
}

function deviceReady(){
  $(document).ready(function(){

    app.loadDataBase();

    $("#search-btn").click(function(){
      var city = $("#search-input").val() + ",BR";
      var url = "http://api.openweathermap.org/data/2.5/weather";
      var success = function(response) {
        if (response.cod == "404"){
          app.anErrorHappened(response);
        }
        app.setCurrentInformation(response);
        app.current_city_data = [response.name, response.id];
      };
      var error = function(response) {
        app.anErrorHappened(response);
      }
      app.callAjaxByName(city, url, success, error);
    });

    $("#favorite-cities-list").click(function(event){
      var city_data_id = $(event.target).attr("data-id");
      if (city_data_id){
        var favorite_cities = app.getCollection();

        var id = favorite_cities.get(city_data_id).id;
        var url = "http://api.openweathermap.org/data/2.5/weather";
        var success = function(response) {
          if (response.cod == "404"){
            app.anErrorHappened(response);
          }
          app.setCurrentInformation(response);
          app.current_city_data = [response.name, response.id];
        };
        var error = function(response) {
          app.anErrorHappened(response);
        }
        app.callAjaxById(id, url, success, error);
        $("#left-panel").panel("close");
      }
    });

    $("#add-favorite-btn").click(function(){
      if (!app.dataBaseHasCity(app.current_city_data[0])){
        app.addCity(app.current_city_data);
      }
    });

    $("#forecast-btn").click(function(){
      var id = app.current_city_data[1];
      var url = "http://api.openweathermap.org/data/2.5/forecast";
      var success = function(response) {
        if (response.cod == "404"){
          app.anErrorHappened(response);
        }
        app.setForecastInformation(response);
        $("#forecast-modal").modal("show");
      };
      var error = function(response) {
        app.anErrorHappened(response);
      }
      app.callAjaxById(id, url, success, error);
    });

    $("#clear-list-btn").click(function(){
      app.getCollection().clear();
      $("#favorite-cities-list").html("");
    });
  });
}

















//
