$('document').ready(function() {
  var content = $('.content');
  var loadingSpinner = $('#loading');
  content.css('display', 'block');
  loadingSpinner.css('display', 'none');
  
  var webAuth = new auth0.WebAuth({
    domain: AUTH0_DOMAIN,
    clientID: AUTH0_CLIENT_ID,
    redirectUri: AUTH0_CALLBACK_URL,
    // Set the Identifier for our new API
    audience: 'http://pizza-app.com/api',
    responseType: 'token id_token',
    // Scope - Limit User to Create and Read - No Delete
    scope: 'openid profile create:pizza_orders read:pizza_orders',
    leeway: 60
  });

  // Create variables for DOM Sections
  var loginStatus = $('.container h4');
  var loginView = $('#login-view');
  var homeView = $('#home-view');
  var profileView = $('#profile-view');
  var pingView = $('#ping-view');

  // buttons and event listeners
  var homeViewBtn = $('#btn-home-view');
  var loginBtn = $('#btn-login');
  var logoutBtn = $('#btn-logout');
  var orderBtn = $('#btn-order');

  // Profile View
  var userProfile;

  // Home Button Click
  homeViewBtn.click(function() {
    homeView.css('display', 'inline-block');
    loginView.css('display', 'none');
  });

  // Login Button Click
  loginBtn.click(function(e) {
    e.preventDefault();
    webAuth.authorize();
  });

  // Order Button Click
  orderBtn.click(function(e) {
    e.preventDefault();
    console.log('Prepare for Pizza Order Goodness');
    // Call the API with Scope Authorization
    callAPI('/private-scoped');
  });

  // Logout Button Click
  logoutBtn.click(logout);


  function setSession(authResult) {
    // Set the time that the access token will expire at
    var expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
  }

  function logout() {
    // Remove tokens and expiry time from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    displayButtons();
  }

  function isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    var expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  function handleAuthentication() {
    webAuth.parseHash(function(err, authResult) {
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        setSession(authResult);
        loginBtn.css('display', 'none');
        homeView.css('display', 'inline-block');
        // Let's view our User Data in the Console
        console.log(authResult);
      } else if (err) {
        homeView.css('display', 'inline-block');
        console.log(err);
        alert(
          'Error: ' + err.errorDescription
        );
      }
      displayButtons();
    });
  }

  function displayButtons() {
    if (isAuthenticated()) {
      loginBtn.css('display', 'none');
      logoutBtn.css('display', 'inline-block');
      loginStatus.text('Congratulations, you are logged in!  Use the 'Order Pizza' button to kick off the API! =)');
      orderBtn.css('display', 'block');
      // Display the Profile
      getProfile();
    } else {
      loginBtn.css('display', 'inline-block');
      logoutBtn.css('display', 'none');
      orderBtn.css('display', 'none');
      loginStatus.text('You are not logged in! Please log in to Order Pizza.');
      profileView.css('display', 'none');
      pingView.css('display', 'none');
    }
  }

  function getProfile() {
    if (!userProfile) {
      var accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        console.log('Access Token must exist to fetch profile');
      }

      webAuth.client.userInfo(accessToken, function(err, profile) {
        if (profile) {
          userProfile = profile;
          displayProfile();
        }
      });
    } else {
      displayProfile();
    }
  }

  function displayProfile() {
    // display the profile
    $('#profile-view .nickname').text(userProfile.nickname);
    $('#profile-view .full-profile').text(JSON.stringify(userProfile, null, 2));
    $('#profile-view img').attr('src', userProfile.picture);
  }

  // Let's Communicate with the API

  var apiUrl = 'http://165.227.55.10:3010/api';

  // ...
  function callAPI(endpoint) {
    var url = apiUrl + endpoint;
    var accessToken = localStorage.getItem('access_token');

    var headers;
    if (accessToken) {
      headers = { Authorization: 'Bearer ' + accessToken };
    }

    $.ajax({
      url: url,
      headers: headers
    })
      .done(function(result) {
        $('#ping-view h2').text(result.message);
      })
      .fail(function(err) {
        $('#ping-view h2').text('Request failed: ' + err.statusText);
      });
  }  

  // Authienticate
  handleAuthentication();
});
