#!/usr/bin/env perl
use 5.010;
use strict;
use warnings;
use utf8;
use DBI;
use autodie qw(:all); # apt-get install libipc-system-simple-perl
use Mojo::DOM;
binmode(STDOUT, ":utf8");
use Data::Printer; #  apt-get install libdata-printer-perl

# open my $ind, '>:encoding(UTF-8)', "index.txt";

open(my $fh, '<:encoding(UTF-8)', 'PWN-Ru-Pl.txt')   or die "Could not open file $!";

my $dbh = DBI->connect("dbi:SQLite:pl.db","","", {sqlite_unicode => 1,  AutoCommit => 0, RaiseError => 1}) or die "Could not connect";

my $sql  = "INSERT INTO triple (inform, insimple, title, body, title_lid, lid)  VALUES (?, ?, ?, ?, 2, 4)";

my $sth = $dbh->prepare($sql);

# lid
# be 1, ru 2, uk 3, pl 4, cz 5, bg 10, en 20


while (my $line = <$fh>) {
	my @arr = split(/\t/, $line);
	# say $ind $arr[0];
	my $inform = lc($arr[0]);
	my $insimple = $inform;
	$insimple =~ s/ё/е/g;
	$insimple =~ s/[\-\.\!]//g;
	$sth->execute ($inform, $insimple, @arr)  or die "Couldn't execute statement: " . $sth->errstr;
	$sth->finish();
}
$dbh->commit();
$dbh->disconnect();
close($fh);
