#!/usr/bin/env perl
use strict;
use utf8;
use 5.010;
# use AnyEvent; # libanyevent-perl
# use EV; # libev-perl
use List::Util;
use Mojolicious::Lite;
use Mojo::Log;
# binmode STDOUT, ':encoding(UTF-8)';
use DBI;
use Data::Dumper;
# use Encode;
use Mojolicious::Plugin::Authentication;
use Mojolicious::Plugin::RemoteAddr;
use Mojolicious::Plugin::Config;
use HTTP::BrowserDetect; # libtest-most-perl libhttp-browserdetect-perl 
# use DBIx::Connector; # libdbix-connector-perl
# use List::MoreUtils qw(uniq);
# use List::Util qw(any);

 # say app->sessions->default_expiration(3600); # set expiry to 1 hour
 app->sessions->default_expiration(60*60);
 # say app->sessions->default_expiration(); # set expiry to 1 hour

# my $random_number = int(rand($range));


use Time::HiRes qw/gettimeofday/;

# Disable IPv6, epoll and kqueue
# BEGIN { $ENV{MOJO_NO_IPV6} = $ENV{MOJO_POLL} = 1 }
my $cfg = plugin Config => {file => 'pl.conf'};
plugin('RemoteAddr');
app->config(hypnotoad => {
	listen => ['http://*:'.$cfg->{port}],
	proxy => 1,
	workers => 1
	});
app->secrets(['7b840960b54f7dd5b0c263f44ce273d36b1cd55cbf1b43759611f012e5055039']);
app->defaults(gzip => 1);
app->mode($cfg->{mode});
my $log = Mojo::Log->new(path => $cfg->{log});

app->attr(dbh => sub { # dbh attribute
	my $c = shift;
	my $dbh = DBI->connect("dbi:SQLite:".$cfg->{db},"","", {sqlite_unicode => 1,  AutoCommit => 0, RaiseError => 1, sqlite_use_immediate_transaction => 1,});

	$log->info( $dbh ? "DB connect": "DB error"); 
	return $dbh;
	
	# my $conn = DBIx::Connector->new("dbi:SQLite:".$cfg->{db}, "", "", {sqlite_unicode => 1,  AutoCommit => 0, RaiseError => 1});
});

# under sub {
        # shift->stash(now => join('.', gettimeofday()));
# };



sub checkIdArrRef {
	my ($ref)  = @_;
	my @arr2check = @{$ref};
	my @check_arr;
	foreach my $ii (reverse (0..$#arr2check)) {
		my $ii_id = $arr2check[$ii]->{id};
		# $ii_id ~~ @check_arr ? splice @arr2check, $ii, 1 : push @check_arr, $ii_id;
		List::Util::any {$_ eq $ii_id} @check_arr  ? splice @arr2check, $ii, 1 : push @check_arr, $ii_id;
	}
	return [@arr2check];
}

$log->format(sub {	
    my ($time, $level, @lines) = @_;
    return "[".localtime(time)."]  [$level] ". join("\n", @lines) . "\n";
 });

hook before_dispatch => sub {
   my $c = shift;
   # notice: url must be fully-qualified or absolute, ending in '/' matters.
   $c->req->url->base(Mojo::URL->new($cfg->{site}));
};  

helper log => sub {
	my $c = shift;
	my $text = shift;
	my $uid = $c->current_user->{'id'};
	if ($uid > 1){
		# my $r_ip = $c->tx->remote_address;
		my $r_ip = $c->remote_addr;
		$log->info($r_ip.' {'.$uid.'} '.$c->current_user->{'name'}." • ".$text);
	}
};

plugin 'authentication', {                 
    autoload_user => 0,
    load_user => sub {
        my ($app, $uid) = @_;
		
		my $dbh = app->dbh;
		my @row = $dbh->selectrow_array("select id, fullname from users where id = ?",undef, $uid);

		if(@row){
			# return { 'username' => 'alyaxey.yaskevich@gmail.com', 'password' => 'fMiX3O3vwJAWQli58kRF', 'name' => 'AJ'} 
			return {'name' => $row[1], id=> $row[0]};
		} else {
			return undef;
		}
		
    },
    validate_user => sub {
        my ($app, $username, $password, $extradata) = @_;
		# say Dumper (@_);
		my $br_hr = '';
		my $ua_in = $app->tx->req->headers->user_agent;

		if ($ua_in) {
			my $br = new HTTP::BrowserDetect($ua_in);
			# Please note that that the version(), major() and minor() methods have been deprecated as of release 1.78 of this module. They should be replaced with browser_version(), browser_major(), browser_minor(), and browser_beta().
			# $br_hr =  $br ? $br->browser_string." ".$br->browser_version()." ".$br->os_string : '';
			$br_hr =  $br ? $br->browser_string." ".$br->version()." ".$br->os_string : '';
		}
	
		# say $app->tx->req->headers->accept_language;
		
		$log->info("Access: ".$app->remote_addr." @ ".$br_hr);
		
		if (defined $username and defined $password and length($username) and length($password)){
			my $dbh = app->dbh;
			unless ($username =~ m/^[\w\.\-\_]+\@([\da-zA-Z\-]{1,}\.){1,}[\da-zA-Z-]{2,6}$/){
				$log->info( "email ".$username." is bad"); 
			} else {
				unless ($password =~ m/^[\w\d]+$/){
					$log->info( "password ".$username." is bad"); 
				} else {
					my @row = $dbh->selectrow_array("select id from users where email = ? AND psswd = ? ",undef, $username, $password);
					unless (@row) { 
						$log->info( "user ".$username." not found in database"); 
					} else {
						$log->info("Logged in: {".$row[0].'} @ '.$br_hr);
						return $row[0];
						# return 'userid' if($username eq 'a' && $password eq 'b');
					}
				}
			}
		} else {
			$log->info("empty name/pass");
		}
        return undef;
    },
};     



any '/' => sub {                
    my $c = shift;
	# $c->req->param('u'), $c->req->param('p')
	($c->is_user_authenticated or $c->authenticate('alyaxey.yaskevich@gmail.com', 'fMiX3O3vwJAWQli58kRF'))
		? 
		$c->reply->static('index.html') 
		:
		$c->render(template => 'login', status => 200);
};


get '/logout' => (authenticated => 1) => sub {
    my $c = shift;
	$c->log('Logout!');
    $c->logout;
    # $c->render(text => 'Good bye.');
	$c->redirect_to('/');
};

get '/user' => (authenticated => 1) => sub {
    my $c = shift;
	$c->render(text => $c->current_user->{'name'});
};


any '/data.json' => (authenticated => 1) => sub {
	my $c = shift;
	my $y = $c->req->params->[0];
	my $q = $y;
	# $q =~ s/[^A-Za-z\sĄąŻżŹźŚśĆćŃńŁłĘęÓó\!]//g;
	$c->log('Typed: '.$y.' → '.$q);
	my $dbh = $c->app->dbh;

	my $ref = $dbh->selectall_arrayref("select id, title, lid from triple where inform like '".$q."' LIMIT 3", { Slice => {} }  );
	my $ref3 = $dbh->selectall_arrayref("select id, title, lid from triple where inform like '".$q."%' LIMIT 2", { Slice => {} }  );	
	push @{$ref}, @{$ref3}; 
	
	my $ref1 = $dbh->selectall_arrayref("select id, title, lid from triple where insimple like '".$q."' LIMIT 3", { Slice => {} }  );
	my $ref2 = $dbh->selectall_arrayref("select id, title, lid from triple where insimple like '".$q."%' LIMIT 5", { Slice => {} }  );
	push @{$ref}, @{$ref1}; 
	push @{$ref}, @{$ref2}; 
	$ref = checkIdArrRef($ref);
	
	
	# my $ref = $dbh->selectall_arrayref("select id, title from triple where inform = '".$q."' OR insimple = '".$q."' LIMIT 5", { Slice => {} }  );
	# my $delta = scalar(@{$ref});
	# if ($delta < 5){
		# my $ref2 = $dbh->selectall_arrayref("select id, title from triple where inform like '".$q."%' AND inform <> '".$q."'  LIMIT ".$delta, { Slice => {} }  );
		# unless (@{$ref2}){
			# say "o-O";
			# $ref2 = $dbh->selectall_arrayref("select id, title from triple where insimple like '".$q."%' AND insimple <> '".$q."'  LIMIT ".$delta, { Slice => {} }  );
		# }
		# push @{$ref}, @{$ref2}; 
	# } else {
		# say 'ok';
	# }
		
	
	$c->render(json => $ref );
};

any '/datum.json' => (authenticated => 1) => sub {
	
	my $c = shift;
	my $q = $c->req->params->[0];
	
	$c->log('Requested: '.$q);
	
	my $ref;
	if ($q =~ /\d+/){
		my $dbh = $c->app->dbh;	
		$ref = $dbh->selectall_arrayref("select * from triple where id = ".$q, { Slice => {} }  );
	}
	$c->render(json => $ref );
};

any '/def.json' => (authenticated => 1) => sub {
	
	my $c = shift;
	my $q = $c->req->params->[0];
	
	my $dbh = $c->app->dbh;
	# my $ref = $dbh->selectall_arrayref("select id, title from triple WHERE random() % 2 = 0 LIMIT 5;", { Slice => {} }  );
	
	my $rnds = join(' OR id=', map { int(rand(132000)) } ( 1..10 ));
	my $ref = $dbh->selectall_arrayref("select id, title from triple where id = ".$rnds, { Slice => {} }  );
	# my $ref = $dbh->selectall_arrayref("select id, title from triple ORDER BY RANDOM()  LIMIT 20", { Slice => {} }  );
	
	$c->render(json => $ref );
};
app->start;

__DATA__

@@ foo.html.ep

% layout 'default';
% title 'Foo';


@@login.html.ep
%= t h2 => 'Dostęp jest ograniczony'
%= t h4 => 'Proszę wpisać swój e-mail oraz hasło'
<style>
body{
font-family: Georgia, Times, "Times New Roman", serif;
}
.myfields label, .myfields input {
  display:inline-block;
  margin-top:5px;
}
.myfields label {
  width: 70px; 
  font-variant:small-caps; 
}
fieldset {
	width:300px; 
}

.userinput {
    padding:5px; 
    border:2px solid #ccc; 
    -webkit-border-radius: 5px;
    border-radius: 5px;
	width:220px;
	font-family:inherit;
}

.userinput:focus {
    border-color:#333;
}

input[type=submit] {
    padding:5px 15px; 
    background:#ccc; 
    border:0 none;
    cursor:pointer;
    -webkit-border-radius: 5px;
    border-radius: 5px; 
	width:300px;
	font-family:inherit;
}

</style>
%= form_for '/' => (method => 'post') => begin
<form method="post" action="/">
    
<fieldset id="checkit" class="myfields">
  <div>
    <label for="u">e-mail</label>
	<input type="text" class="userinput" id="u" name="u" value="" />    
  </div>

  <div>
    <label for="p">hasło</label>
    <input type="password" class="userinput" id="p" name="p" value="" />    
  </div>
  %= submit_button 'wejść' 
</fieldset>	
%= end