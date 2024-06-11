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
use Unicode::Normalize;


# open my $ind, '>:encoding(UTF-8)', "index.txt";

open(my $fh, '<:encoding(UTF-8)', 'PWN-Pl-Ru.txt')   or die "Could not open file $!";


my $dbh = DBI->connect("dbi:SQLite:pl.db","","", {sqlite_unicode => 1,  AutoCommit => 0, RaiseError => 1}) or die "Could not connect";

# say $dbh->{sqlite_version};
# my $sth = $dbh->prepare('CREATE VIRTUAL TABLE email USING fts5(sender, title, body)');
# my $sth = $sth->execute or die "Couldn't execute statement: " . $sth->errstr;
# $sth->finish();
# exit;
my $sql  = "INSERT INTO triple (inform, insimple, title, body, title_lid, lid)  VALUES (?, ?, ?, ?, 4, 2)";
my $sth = $dbh->prepare($sql);

# lid
# be 1, ru 2, uk 3, pl 4, cz 5, bg 10, en 20

while (my $line = <$fh>) {
	my @arr = split(/\t/, $line);
	# say $ind $arr[0];
	my $title = $arr[0];
	my $inform = lc($title);
	my $body = $arr[1];
	# if ($title eq 'iść') {
		$body =~ s/\\n\s+/\n/g;
		$body =~ s/\\n/\n/g;
		# $body 
		my $dom = Mojo::DOM->new($body);
		die if $dom->at('k')->text ne $title;
		$dom->at('k')->remove();
		my $entry = $dom->at('dtrn')->strip()->to_string;
		$entry =~ s/^\s*\n\s*//; 
		$entry =~ s/\s*\n\s*$//; 
		# say $entry;
		  # List tag names of child elements
		# say $dom->children->map('tag')->join(" ");
		# exit;
	# }
	
	my $insimple = NFKD( $inform );
	$insimple =~ s/\p{NonspacingMark}//g;
	$insimple =~ y/Łł/Ll/;
	# maybe remove hyphen ???? , quote marks

	$sth->execute ($inform, $insimple, $title, $entry)  or die "Couldn't execute statement: " . $sth->errstr;
	$sth->finish();
}

$dbh->commit();
$dbh->disconnect();
close($fh);
