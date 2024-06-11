#!/usr/bin/env perl
use 5.010;
use strict;
use warnings;
use utf8;
use DBI;
use autodie qw(:all); # apt-get install libipc-system-simple-perl
binmode(STDOUT, ":utf8");
use Data::Printer; #  apt-get install libdata-printer-perl
use charnames ();
use Unicode::Normalize;

open my $ind, '>:encoding(UTF-8)', "be-index.txt";

open(my $fh, '<:encoding(UTF-8)', 'pol-bel.dsl')   or die "Could not open file $!";


my $dbh = DBI->connect("dbi:SQLite:pl.db","","", {sqlite_unicode => 1,  AutoCommit => 0, RaiseError => 1}) or die "Could not connect";

my $sql  = "INSERT INTO triple (inform, insimple, title, body, title_lid, lid)  VALUES (?, ?, ?, ?, 4, 1)";

my $sth = $dbh->prepare($sql);

# lid
# be 1, ru 2, uk 3, pl 4, cz 5, bg 10, en 20
my $polish = qr/^[A-ZĄĆĘŁŃÓŚŹŻ\séà\-]+$/i;
my $dummy=<$fh>;   # skip first line 
$dummy=<$fh>; 
$dummy=<$fh>;
my $in = '';
my $body = '';
my $root = '';
my $ct = 0;
while (my $l = <$fh>) {
	chomp $l;
	if ($l =~ m/^[^\t]/){ # in input word
		++$ct;
		$body = '';
		$l =~ s/[\r\n]//g;
		
		my ($stem, $gen, $syn, $excl, $bound, $proper) = ('', '', '', 0, 0, 0);
		
		if ($l !~ m/$polish/) { # + é
			if ($l =~ m/^(.*?)\{\s\,\s\\\~u\}$/) {
				$stem = $1;
				$gen = $1.'u';
				# say $ind '▪'.$stem."→".$gen; 
			} elsif ($l =~ m/^(.*?)\{ \, \\\~(\S+)\}$/) { # adamaszek{ , \~ku}
				$stem = $1;
				my $end = $2;
				my $str = quotemeta('/\~');
				# say $ind $stem;
				foreach my $finale (split($str, $end)) {
					my $le = length($stem) - (length($finale)-1);
					my $gen2 = substr($stem, 0, $le).$finale;
					$gen .= $gen2."¦";
					# say $ind "\t►".$gen2;
				}
				# say $ind $stem."►".$end if $end =~ /\~/;
				
			} elsif ($l =~ m/^(.*?)\{ \\\~u}$/) { # Gudogaj{ \~u}
				$stem = $1;
				$gen = $1.'u';
				# say $ind '▪'.$stem."→".$gen;
			} elsif ($l =~ m/^(.*?)\{ \1 u\}$/) { # Abidżan{Abidżanu}
				$stem = $1;
				$gen = $1.'u';
				# say $ind '▪'.$stem."→".$gen;
			} elsif ($l =~ m/^(.*?)\{\s\:\}$/) { # cna{:}
				$stem = $1;
				$bound = 1;
				# say $ind $stem; 
			} elsif ($l =~ m/^(.*?)\{\s\!\}$/) { # ba{!}
				$stem = $1;
				$excl = 1;
				# say $ind '♥'.$stem; 
			} elsif ($l =~ m/^(.*?){ \, (.*?)\}/) { # krąg{ , kręgu}
				$stem = $1;
				$gen = $2;
				# say $ind '▪'.$stem."→".$gen; 
			} elsif ($l =~ m/^(.*?)\s\((.*?)\)/) { 
				$stem = $1;
				$syn = $2;
				# say $ind '•'.$stem.'<SYN>'.$syn; 
			} elsif ($l =~ m/^(.*?)\{\s(.*?)\}/) { # Ułan Bator{ Ułan Batoru}
				$stem = $1;
				$gen = $2;
				# say $ind '▪'.$stem."→".$gen; 
			} 
			else {
				say $ind $l;
				&checkChars($l);
			}
			
			if ($stem !~ m/$polish/) {
				say $ind $l;
				&checkChars($l);
			}
		} else {
			$stem = $l;
		}
		
		$proper = 1 if ($stem =~ /[[:upper:]]/); # check case
		# $proper = 1 if ($stem =~ /\p{Lu}/); # check case

		# say $ind $stem if $proper;
		$in = $stem;
		say $ind $stem;
		
		
		
		# be ready for éà vis-à-vis
		# my ($stem, $gen, $syn, $excl, $bound, $proper) = ('', '', '', 0, 0, 0);
	} elsif($l eq "\t"){
		$root = '';
		# say $ind '—';
		# end of the entry → post to DB
		my $inform = lc($in);
		my $insimple = NFKD ($inform);
		$insimple =~ s/\p{NonspacingMark}//g;
		$insimple =~ y/Łł/Ll/;
	
		$sth->execute ($inform, $insimple, $in, $body)  or die "Couldn't execute statement: " . $sth->errstr;
		$sth->finish();
	}
	else { # entry body
		
		#  \[[t]ad hok[/t]\]
		
		my @rem = qw ¦[m1] [/m] [m2] [/*] [/ex] [ex] [/trn] [trn] [c] [/c] [p] [/p]¦; 
		my $tg_lng = quotemeta('[lang id=1045]');
		my $tg_lng2 = quotemeta('[/lang]');

		$l =~ s/$tg_lng/<span class="pl">/;
		$l =~ s/$tg_lng2/<\/span>/;

		
		my $tr1 = quotemeta('\[[t]');
		my $tr2 = quotemeta('[/t]\]');
		
		$l =~ s/$tr1/<span class="trans">/;
		$l =~ s/$tr2/<\/span>/;
		
	
		$l =~ s/\[\*\]/▪/g;
		
		
		
		foreach my $r (@rem) {
			my $re = quotemeta($r);
			$l =~ s/$re//g;
		}
		# after useleless tags removal
		
		my $com1 = quotemeta('[i][com]');
		my $com2 = quotemeta('[/com][/i]');
		
		$l =~ s/$com1/<span class="spec">/g;
		$l =~ s/$com2/<\/span>/g;
	
		$l =~ s/\[/</g;
		$l =~ s/\]/>/g;
		
		$l =~ s/\;$//g;
		# dɛsɛmantizɛ
		# <ref>albo</ref>
		
		if ($l =~ /\>(.*?)\|\|/){
			$root = $1;
		}
		
		my $pst = $root || $in;
		$l =~ s/\\\~/<span class="root">$pst<\/span>/g;
		
		$l =~ s/\t//g;
		
		say $ind $l;
		$body .= $l."\n";
	}
	
}
say STDERR $ct;
$dbh->commit();
$dbh->disconnect();
close($fh);

sub checkChars (){
	my ($str) = @_;
	foreach my $char (split("", $str)) {
		if ($char !~ m/$polish/i){
			print $ind '►'.$char;
			print $ind " ".charnames::viacode(ord($char));
			print $ind "\n";
		}
	}
}