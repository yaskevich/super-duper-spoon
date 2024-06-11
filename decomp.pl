#!/usr/bin/env perl
use 5.010;
use strict;
use warnings;
use utf8;
use DBI;
use autodie qw(:all); # apt-get install libipc-system-simple-perl

use Mojo::DOM;
binmode(STDOUT, ":utf8");

use Unicode::Normalize;

# my $test = "Vous avez aimé l'épée offerte par les elfes à Frodon";
# my $test = 'wpadać';
my $test = 'A-ZĄĆĘŁłŃÓŚŹŻ\séà';

my $decomposed = NFKD( $test );
$decomposed =~ s/\p{NonspacingMark}//g;
$decomposed =~ y/Łł/Ll/;


print $decomposed;

